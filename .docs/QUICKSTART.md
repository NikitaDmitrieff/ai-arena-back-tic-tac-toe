# Quick Start Guide

## 🚀 Get LLM vs LLM Games Running in 3 Steps

### Step 1: Set Up API Keys

Create a `.env` file in the tic-tac-toe directory:

```bash
# Create .env file
cat > .env << 'EOF'
OPENAI_API_KEY=sk-your-actual-openai-key-here
EOF
```

Get your OpenAI API key from: https://platform.openai.com/account/api-keys

### Step 2: Start the Services

```bash
# Build and start Docker containers
docker-compose up --build
```

Wait for:
```
✓ Container tictactoe-backend  Started
✓ Container tictactoe-frontend Started
```

### Step 3: Create an LLM Battle

```bash
# Create an LLM vs LLM game
curl -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_x": {"use_llm": true, "provider": "openai", "model": "gpt-4o-mini"},
    "player_o": {"use_llm": true, "provider": "openai", "model": "gpt-4o-mini"}
  }'
```

You'll get back a `game_id`. Use it to play:

```bash
# Let the LLMs battle (replace {game_id} with actual ID)
curl -X POST http://localhost:8000/games/{game_id}/auto
```

## 📊 Check the Logs

Logs are automatically saved to `./logs/` directory:

```bash
# View recent games
tail -n 20 logs/games_*.csv | column -t -s,

# View move details
tail -n 50 logs/moves_*.csv | column -t -s,
```

## 🎮 Using the Frontend

Open http://localhost:3000 in your browser for a visual interface.

**Note:** The frontend creates random player games by default. For LLM games, use the API as shown above.

## 🧪 Local Testing (Without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Run test script
python test_llm_game.py
```

## 🎯 Example API Calls

### Random vs Random
```bash
curl -X POST http://localhost:8000/games
```

### LLM vs Random
```bash
curl -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_x": {"use_llm": true},
    "player_o": {"use_llm": false}
  }'
```

### Different Models/Temperatures
```bash
curl -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_x": {
      "use_llm": true,
      "model": "gpt-4o-mini",
      "temperature": 0.3
    },
    "player_o": {
      "use_llm": true,
      "model": "gpt-4o",
      "temperature": 1.0
    }
  }'
```

## 📝 What Gets Logged

### Moves Log
- Every prompt sent to the LLM
- Every response received
- LLM's reasoning for each move
- Response time in milliseconds
- Board state at each step

### Games Log
- Player types and models used
- Game outcome (winner/draw)
- Total moves and duration
- Final board state

## 🔧 Troubleshooting

**"LLM move failed or invalid. Using random fallback."**
- Check API key is correct in `.env`
- Verify you have API credits
- Check container logs: `docker logs tictactoe-backend`

**No logs appearing?**
- Check `./logs/` directory exists
- Verify volume mount: `docker-compose config`
- Check permissions: `ls -la logs/`

**Import error for nikitas_agents?**
- Rebuild: `docker-compose build --no-cache`
- The code has fallback - this shouldn't break functionality

## 💡 Tips

1. **Cost Control**: Use `gpt-4o-mini` for testing (much cheaper)
2. **Variety**: Try different temperatures (0.3 = conservative, 1.0 = creative)
3. **Analysis**: Use CSV logs to study LLM strategies
4. **Batch Testing**: Run multiple games to compare models

## 📚 More Info

- Full documentation: `README.md`
- Implementation details: `IMPLEMENTATION.md`
- API docs: http://localhost:8000/docs (when running)
