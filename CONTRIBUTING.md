# Contributing to burner-bouncer

Thank you for helping keep the blocklist accurate!

## Adding domains to the blocklist

1. Fork the repository and create a branch: `git checkout -b add/domain-name`
2. Open `data/disposable_domains.json`
3. Add the domain(s) in alphabetical order — the list must stay sorted and deduplicated
4. Verify your changes: the file should remain valid JSON (an array of lowercase strings)
5. Open a pull request — CI will run automatically

**One PR per domain or batch of related domains** keeps reviews fast.

## Auto-syncing from upstream sources

To pull in new domains from upstream blocklists automatically:

```bash
node scripts/sync-blocklist.js          # merge and write
node scripts/sync-blocklist.js --dry-run  # preview only
```

## Running the test suites

**JavaScript**
```bash
cd js
npm install
npm test
npm run build   # verify the bundle builds cleanly
```

**Python**
```bash
cd python
pip install -e .
pip install pytest
pytest
```

## Adding new functions

- JS source: `js/src/index.ts`
- Python source: `python/burner_bouncer/__init__.py`
- Keep both implementations in sync — same function names (snake_case for Python, camelCase for JS) and identical behaviour
- Add tests in `js/tests/index.test.ts` and `python/tests/test_burner_bouncer.py`
- Update `README.md` API tables

## Commit style

```
feat: add isFreeProvider function
fix: handle empty-string domain edge case
data: add 12 new disposable domains
```

## Code of conduct

Be kind. PRs, issues, and discussions should be constructive and respectful.
