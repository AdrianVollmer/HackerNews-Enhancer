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

bump version:
    #!/usr/bin/env python3
    import json, pathlib, subprocess
    p = pathlib.Path('hn-enhancer/manifest.json')
    m = json.loads(p.read_text())
    m['version'] = '{{version}}'
    p.write_text(json.dumps(m, indent=2) + '\n')
    subprocess.run(['git', 'add', str(p)], check=True)
    subprocess.run(['git', 'commit', '-m', 'Bump version to {{version}}'], check=True)
    subprocess.run(['git', 'tag', 'v{{version}}'], check=True)
    print('Bumped to {{version}}')

pack: build
    #!/usr/bin/env bash
    mkdir -p dist
    version=$(python3 -c "import json; print(json.load(open('hn-enhancer/manifest.json'))['version'])")
    cd hn-enhancer && zip -r "../dist/hn-enhancer-${version}.zip" .

userscript: build
    python3 scripts/build_userscript.py

source:
    #!/usr/bin/env bash
    mkdir -p dist
    version=$(python3 -c "import json; print(json.load(open('hn-enhancer/manifest.json'))['version'])")
    git archive --format=tar.gz --prefix="hn-enhancer-${version}/" HEAD -o "dist/hn-enhancer-${version}.tar.gz"
    echo "Written dist/hn-enhancer-${version}.tar.gz"
