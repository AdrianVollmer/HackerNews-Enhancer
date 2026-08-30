deno := `command -v deno >/dev/null 2>&1 && echo deno || echo "uv tool run deno"`

default: check

build:
    {{deno}} bundle src/content.ts -o hn-enhancer/content.js
    {{deno}} bundle src/early.ts -o hn-enhancer/early.js

lint:
    {{deno}} lint
    {{deno}} fmt --check

fmt:
    {{deno}} fmt

test:
    {{deno}} test --allow-all tests/

check: lint test

pack: build
    mkdir -p dist
    cd hn-enhancer && zip -r ../dist/hn-enhancer.zip .

userscript: build
    mkdir -p dist
    python3 build_userscript.py dist/hn-enhancer.user.js
