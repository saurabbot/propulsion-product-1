from __future__ import annotations

import asyncio
import logging
from dotenv import load_dotenv
import json
import os
from typing import Any

from livekit import rtc, api
from livekit.agents import (
    AgentSession,
    Agent,
    JobContext,
    function_tool,
    RunContext,
    get_job_context,
    cli,
    WorkerOptions,
    RoomInputOptions,
)
from livekit.plugins import (
    deepgram,
    openai,
    cartesia,
    silero,
    noise_cancellation,  # noqa: F401
)
from livekit.plugins.turn_detector.english import EnglishModel


# load environment variables, this is optional, only used for local development
load_dotenv(dotenv_path="secrets.env")

# Force HF_HOME to the location where we downloaded models in the Dockerfile
os.environ["HF_HOME"] = "/opt/huggingface"

logger = logging.getLogger("outbound-caller")
logger.setLevel(logging.INFO)

# Debug Environment
hf_home = os.getenv("HF_HOME")
print(f"DEBUG: User ID: {os.getuid()}")
print(f"DEBUG: HF_HOME (Forced): {hf_home}")
if hf_home and os.path.exists(hf_home):
    print(f"DEBUG: Listing {hf_home}:")
    for root, dirs, files in os.walk(hf_home):
        print(f"  {root}: {files}")
else:
    print(f"DEBUG: HF_HOME not found or empty: {hf_home}")

outbound_trunk_id = os.getenv("SIP_OUTBOUND_TRUNK_ID") or os.getenv("SIP_TRUNK_ID")


class OutboundCaller(Agent):
    def __init__(
        self,
        *,
        name: str,
        appointment_time: str,
        dial_info: dict[str, Any],
    ):
        super().__init__(
            instructions=f"""
            Your are restaurant receptionist. Your interface with user will be voice.
            You will be on a call with a customer who wants to make a reservation.
            You will need to confirm the customer's name, phone number, and the date and time of the reservation.
            You will also need to confirm the number of people in the party.
            You will then need to confirm the reservation with the customer.
            You will then need to transfer the call to a human agent.
            You will then need to end the call.
            You will then need to transfer the call to a human agent.
            """
        )
        # keep reference to the participant for transfers
        self.participant: rtc.RemoteParticipant | None = None

        self.dial_info = dial_info

    def set_participant(self, participant: rtc.RemoteParticipant):
        self.participant = participant

    async def hangup(self):
        """Helper function to hang up the call by deleting the room"""

        job_ctx = get_job_context()
        await job_ctx.api.room.delete_room(
            api.DeleteRoomRequest(
                room=job_ctx.room.name,
            )
        )

    @function_tool()
    async def transfer_call(self, ctx: RunContext):
        """Transfer the call to a human agent, called after confirming with the user"""

        transfer_to = self.dial_info["transfer_to"]
        if not transfer_to:
            return "cannot transfer call"

        logger.info(f"transferring call to {transfer_to}")

        # let the message play fully before transferring
        await ctx.session.generate_reply(
            instructions="let the user know you'll be transferring them"
        )

        job_ctx = get_job_context()
        try:
            await job_ctx.api.sip.transfer_sip_participant(
                api.TransferSIPParticipantRequest(
                    room_name=job_ctx.room.name,
                    participant_identity=self.participant.identity,
                    transfer_to=f"tel:{transfer_to}",
                )
            )

            logger.info(f"transferred call to {transfer_to}")
        except Exception as e:
            logger.error(f"error transferring call: {e}")
            await ctx.session.generate_reply(
                instructions="there was an error transferring the call."
            )
            await self.hangup()

    @function_tool()
    async def end_call(self, ctx: RunContext):
        """Called when the user wants to end the call"""
        logger.info(f"ending the call for {self.participant.identity}")

        # let the agent finish speaking
        current_speech = ctx.session.current_speech
        if current_speech:
            await current_speech.wait_for_playout()

        await self.hangup()

    @function_tool()
    async def look_up_availability(
        self,
        ctx: RunContext,
        date: str,
    ):
        """Called when the user asks about alternative appointment availability

        Args:
            date: The date of the appointment to check availability for
        """
        logger.info(
            f"looking up availability for {self.participant.identity} on {date}"
        )
        await asyncio.sleep(3)
        return {
            "available_times": ["1pm", "2pm", "3pm"],
        }

    @function_tool()
    async def confirm_appointment(
        self,
        ctx: RunContext,
        date: str,
        time: str,
    ):
        """Called when the user confirms their appointment on a specific date.
        Use this tool only when they are certain about the date and time.

        Args:
            date: The date of the appointment
            time: The time of the appointment
        """
        logger.info(
            f"confirming appointment for {self.participant.identity} on {date} at {time}"
        )
        return "reservation confirmed"

    @function_tool()
    async def detected_answering_machine(self, ctx: RunContext):
        """Called when the call reaches voicemail. Use this tool AFTER you hear the voicemail greeting"""
        logger.info(f"detected answering machine for {self.participant.identity}")
        await self.hangup()


# Pre-load models to reduce latency
logger.info("Pre-loading models...")
try:
    _vad_model = silero.VAD.load()
    logger.info("VAD model pre-loaded")
except Exception as e:
    logger.warning(f"Could not pre-load VAD model: {e}")
    _vad_model = None

# EnglishModel requires job context, so we cannot pre-load it globally
# _turn_detector = EnglishModel()

async def entrypoint(ctx: JobContext):
    logger.info(f"connecting to room {ctx.room.name}")
    
    # Debug Environment within entrypoint
    hf_home = os.getenv("HF_HOME")
    logger.info(f"DEBUG ENTRYPOINT: HF_HOME: {hf_home}")
    
    await ctx.connect()

    # when dispatching the agent, we'll pass it the approriate info to dial the user
    # dial_info is a dict with the following keys:
    # - phone_number: the phone number to dial
    # - transfer_to: the phone number to transfer the call to when requested
    try:
        dial_info = json.loads(ctx.job.metadata)
        participant_identity = dial_info["phone_number"]
        phone_number = dial_info["phone_number"]
        is_outbound = True
    except Exception:
        logger.warning("failed to decode job metadata, falling back to console/inbound mode")
        dial_info = {"phone_number": "console_user", "transfer_to": ""}
        participant_identity = None
        is_outbound = False

    # look up the user's phone number and appointment details
    agent = OutboundCaller(
        name="Jayden",
        appointment_time="next Tuesday at 3pm",
        dial_info=dial_info,
    )

    logger.info("Initializing AgentSession and Plugins...")
    try:
        # the following uses GPT-4o, Deepgram and Cartesia
        session = AgentSession(
            turn_detection=EnglishModel(),
            vad=_vad_model or silero.VAD.load(),
            stt=deepgram.STT(),
            # you can also use OpenAI's TTS with openai.TTS()
            tts=cartesia.TTS(),
            llm=openai.LLM(model="gpt-4o"),
            # you can also use a speech-to-speech model like OpenAI's Realtime API
            # llm=openai.realtime.RealtimeModel()
        )
        logger.info("AgentSession initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize AgentSession or Plugins: {e}", exc_info=True)
        raise e

    # start the session first before dialing, to ensure that when the user picks up
    # the agent does not miss anything the user says
    session_started = asyncio.create_task(
        session.start(
            agent=agent,
            room=ctx.room,
            room_input_options=RoomInputOptions(
                # enable Krisp background voice and noise removal
                noise_cancellation=noise_cancellation.BVCTelephony(),
            ),
        )
    )

    if is_outbound:
        # `create_sip_participant` starts dialing the user
        try:
            await ctx.api.sip.create_sip_participant(
                api.CreateSIPParticipantRequest(
                    room_name=ctx.room.name,
                    sip_trunk_id=outbound_trunk_id,
                    sip_call_to=phone_number,
                    participant_identity=participant_identity,
                    # function blocks until user answers the call, or if the call fails
                    wait_until_answered=True,
                )
            )

            # wait for the agent session start and participant join
            await session_started
            participant = await ctx.wait_for_participant(identity=participant_identity)
            logger.info(f"participant joined: {participant.identity}")

            agent.set_participant(participant)

        except api.TwirpError as e:
            logger.error(
                f"error creating SIP participant: {e.message}, "
                f"SIP status: {e.metadata.get('sip_status_code')} "
                f"{e.metadata.get('sip_status')}"
            )
            ctx.shutdown()
    else:
        # Console or Inbound mode
        await session_started
        # wait for any participant causing an event (like joining) or just pick the first one
        participant = await ctx.wait_for_participant()
        logger.info(f"participant joined: {participant.identity}")
        agent.set_participant(participant)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="outbound-caller",
        )
    )