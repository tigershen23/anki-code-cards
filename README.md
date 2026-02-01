# Anki Code Cards

Cards with beautiful code in vanilla Anki.

## Development

### Dev Server (PM2-managed)

```bash
# Start server
mise start

# Stop server
mise stop

# Restart server
mise restart

# Tail logs
mise logs

# Or use PM2 directly:
# View logs
pm2 logs anki_code_cards

# Restart server
pm2 restart anki_code_cards

# Check status
pm2 describe anki_code_cards
```

### Testing

```bash
# E2E sanity check test (requires dev server running via PM2)
mise test:e2e

# Quick healthcheck (~1.3s)
mise healthcheck
```
