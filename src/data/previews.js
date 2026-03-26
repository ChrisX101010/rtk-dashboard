export const PREVIEWS = {
  "git status": {
    raw: "On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  (use \"git add <file>...\" to update)\n  (use \"git restore <file>...\" to discard)\n\n\tmodified:   src/main.rs\n\tmodified:   src/filters/git.rs\n\tmodified:   src/output.rs\n\nUntracked files:\n  (use \"git add <file>...\" to include)\n\n\tsrc/new_module.rs\n\ttests/integration_test.rs\n\nno changes added to commit",
    compressed: "M src/main.rs\nM src/filters/git.rs\nM src/output.rs\n?? src/new_module.rs\n?? tests/integration_test.rs",
  },
  "cargo test": {
    raw: "   Compiling rtk v0.27.1\n    Finished test target(s) in 4.32s\n     Running unittests src/main.rs\n\nrunning 48 tests\ntest filters::git::test_status ... ok\ntest filters::git::test_diff ... ok\ntest filters::file::test_read ... ok\ntest filters::file::test_ls ... ok\ntest output::test_format ... ok\n... (43 more passing tests)\ntest edge::test_unicode ... FAILED\ntest edge::test_overflow ... FAILED\n\nfailures:\n\n---- edge::test_unicode stdout ----\npanicked at 'assertion failed:\n  left: \"\\u{feff}hello\"\n  right: \"hello\"', src/filters/edge.rs:42\n\n---- edge::test_overflow stdout ----\npanicked at 'capacity overflow',\n  src/output.rs:118\n\ntest result: FAILED. 46 passed; 2 failed",
    compressed: "FAILED: 2/48 tests (46 passed)\n\n  test_unicode\n    assertion: \"\\u{feff}hello\" != \"hello\"\n    at src/filters/edge.rs:42\n\n  test_overflow\n    capacity overflow at src/output.rs:118",
  },
  "git push": {
    raw: "Enumerating objects: 7, done.\nCounting objects: 100% (7/7), done.\nDelta compression using up to 10 threads\nCompressing objects: 100% (4/4), done.\nWriting objects: 100% (4/4), 1.23 KiB\nTotal 4 (delta 3), reused 0 (delta 0)\nremote: Resolving deltas: 100% (3/3)\nTo github.com:rtk-ai/rtk.git\n   abc1234..def5678  main -> main",
    compressed: "ok main abc1234..def5678",
  },
  "docker logs": {
    raw: "2024-03-14T10:00:01Z INFO  Starting server...\n2024-03-14T10:00:02Z INFO  DB connected\n2024-03-14T10:00:02Z INFO  Listening on :8080\n2024-03-14T10:00:15Z INFO  GET /health 200 1ms\n2024-03-14T10:00:30Z INFO  GET /health 200 1ms\n2024-03-14T10:00:45Z INFO  GET /health 200 1ms\n2024-03-14T10:01:00Z INFO  GET /health 200 1ms\n2024-03-14T10:01:02Z INFO  GET /api/users 200 24ms\n2024-03-14T10:01:15Z INFO  GET /health 200 1ms\n2024-03-14T10:01:30Z INFO  GET /health 200 1ms\n2024-03-14T10:02:05Z WARN  Slow query: SELECT * FROM orders (234ms)",
    compressed: "INFO  Starting server\nINFO  DB connected\nINFO  Listening on :8080\nINFO  GET /health 200 1ms (x6 repeated)\nINFO  GET /api/users 200 24ms\nWARN  Slow query: SELECT * FROM orders (234ms)",
  },
  "eslint .": {
    raw: "/src/Header.tsx\n  12:5   warning  'useEffect' unused        no-unused-vars\n  45:10  warning  Unexpected any             no-explicit-any\n\n/src/Sidebar.tsx\n  8:5    warning  'useEffect' unused        no-unused-vars\n\n/src/api.ts\n  23:14  error    possibly undefined         no-unnecessary-condition\n  67:3   warning  Unexpected any             no-explicit-any\n  89:3   warning  Unexpected any             no-explicit-any\n\n/src/Dashboard.tsx\n  15:5   warning  'useCallback' unused       no-unused-vars\n  102:8  error    Missing return type        explicit-function-return-type\n\n8 problems (2 errors, 6 warnings)",
    compressed: "2 errors, 6 warnings\n\nBy rule:\n  no-unused-vars (3) Header:12, Sidebar:8, Dashboard:15\n  no-explicit-any (3) Header:45, api:67,89\n  no-unnecessary-condition (1) api:23\n  explicit-function-return-type (1) Dashboard:102",
  },
};
