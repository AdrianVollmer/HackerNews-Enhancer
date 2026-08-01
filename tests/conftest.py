# tests/conftest.py
import pytest
from playwright.sync_api import Page

_MOCK_BROWSER_JS = """
window._hnTestPrefs = {};
window.browser = {
    storage: {
        local: {
            get: (keys) => {
                const ks = Array.isArray(keys) ? keys : Object.keys(keys);
                const result = {};
                for (const k of ks) {
                    if (k in window._hnTestPrefs) result[k] = window._hnTestPrefs[k];
                }
                return Promise.resolve(result);
            },
            set: (obj) => {
                Object.assign(window._hnTestPrefs, obj);
                return Promise.resolve();
            }
        }
    }
};
"""

@pytest.fixture
def hn_page(page: Page):
    page.goto("file:///workspace/_dev/source.html")
    page.evaluate(_MOCK_BROWSER_JS)
    page.add_style_tag(path="hn-enhancer/styles.css")
    page.add_script_tag(path="hn-enhancer/content.js")
    page.wait_for_selector("body[data-hn-enhancer='ready']", timeout=5000)
    return page
