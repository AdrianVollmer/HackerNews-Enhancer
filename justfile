deno := "uv tool run deno"

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
    cd hn-enhancer && zip -r ../hn-enhancer.zip .
