# Naming Conventions

## Agent Type Naming Standard

To ensure consistency across the codebase, use the following naming conventions for agent types:

### Restaurant Receptionist Agent

- **Frontend (TypeScript/React)**: `restaurant-receptionist` (kebab-case with hyphens)
- **Backend Python**: `restaurant-receptionist` (kebab-case with hyphens)
- **LiveKit Agent Name**: `restaurant_receptionist` (snake_case with underscores)
- **Python Logger Names**: `restaurant_receptionist` (snake_case with underscores)
- **File Names**: `template_restaurant_agent.py` (snake_case with underscores)

### Car Vendor Agent

- **Frontend (TypeScript/React)**: `car-vendor` (kebab-case with hyphens)
- **Backend Python**: `car-vendor` (kebab-case with hyphens)
- **LiveKit Agent Name**: `car_vendor` (snake_case with underscores)
- **Python Logger Names**: `car_vendor` (snake_case with underscores)
- **File Names**: `template_car_vendor_agent.py` (snake_case with underscores)

## Key Points

1. **API Endpoints & Database**: Use kebab-case (`restaurant-receptionist`)
2. **Python Internal Variables & LiveKit**: Use snake_case (`restaurant_receptionist`)
3. **File Names**: Use snake_case with `.py` extension
4. **Display Names**: Use Title Case with spaces ("Restaurant Receptionist")

## Examples

### Frontend (TypeScript)
```typescript
agent.agent_type === 'restaurant-receptionist'
{ value: 'restaurant-receptionist', label: 'Restaurant Receptionist Agent' }
```

### Backend (Python)
```python
# API validation
if agent.agent_type not in ["restaurant-receptionist", "car-vendor"]:
    raise HTTPException(...)

# Agent runner
if agent_type == "restaurant-receptionist":
    script_path = cls._base_path / "template_restaurant_agent.py"

# LiveKit agent name
agent_name = "restaurant_receptionist"

# Logger
logger = logging.getLogger("restaurant_receptionist")
```

## Common Mistakes to Avoid

❌ **WRONG**: `resturant` (missing 'a')  
✅ **CORRECT**: `restaurant`

❌ **WRONG**: Mixing formats (e.g., `restaurant_receptionist` in API)  
✅ **CORRECT**: Use kebab-case for API/database, snake_case for Python internals
