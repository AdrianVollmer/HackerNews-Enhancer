# tests/test_hn_enhancer.py
from playwright.sync_api import Page


def test_extension_initialises(hn_page: Page) -> None:
    val = hn_page.evaluate("document.body.dataset.hnEnhancer")
    assert val == 'ready'
