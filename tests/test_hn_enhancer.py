# tests/test_hn_enhancer.py
from playwright.sync_api import Page


def test_extension_initialises(hn_page: Page) -> None:
    val = hn_page.evaluate("document.body.dataset.hnEnhancer")
    assert val == 'ready'


def test_panel_button_visible(hn_page: Page) -> None:
    btn = hn_page.locator('#hn-ext-btn')
    assert btn.is_visible()


def test_panel_hidden_by_default(hn_page: Page) -> None:
    cls = hn_page.locator('#hn-ext-panel').get_attribute('class') or ''
    assert 'hn-open' not in cls


def test_panel_opens_on_click(hn_page: Page) -> None:
    hn_page.locator('#hn-ext-btn').click()
    cls = hn_page.locator('#hn-ext-panel').get_attribute('class') or ''
    assert 'hn-open' in cls


def test_panel_closes_outside_click(hn_page: Page) -> None:
    hn_page.locator('#hn-ext-btn').click()
    hn_page.locator('body').click(position={'x': 10, 'y': 10})
    cls = hn_page.locator('#hn-ext-panel').get_attribute('class') or ''
    assert 'hn-open' not in cls


def test_dark_mode_toggle_applies_class(hn_page: Page) -> None:
    hn_page.locator('#hn-ext-btn').click()
    hn_page.locator('#hn-theme-toggle').click()
    assert hn_page.evaluate("document.body.classList.contains('hn-dark')")


def test_dark_mode_toggle_twice_removes_class(hn_page: Page) -> None:
    hn_page.locator('#hn-ext-btn').click()
    hn_page.locator('#hn-theme-toggle').click()
    hn_page.locator('#hn-theme-toggle').click()
    assert not hn_page.evaluate("document.body.classList.contains('hn-dark')")


def test_dark_mode_persisted(page: Page) -> None:
    """Dark mode pref loaded from storage on init."""
    page.goto("file:///workspace/_dev/source.html")
    page.evaluate("""
        window._hnTestPrefs = { darkMode: true };
        window.browser = {
            storage: { local: {
                get: (keys) => {
                    const ks = Array.isArray(keys) ? keys : Object.keys(keys);
                    const r = {};
                    for (const k of ks) if (k in window._hnTestPrefs) r[k] = window._hnTestPrefs[k];
                    return Promise.resolve(r);
                },
                set: (obj) => { Object.assign(window._hnTestPrefs, obj); return Promise.resolve(); }
            }}
        };
    """)
    page.add_style_tag(path="hn-enhancer/styles.css")
    page.add_script_tag(path="hn-enhancer/content.js")
    page.wait_for_selector("body[data-hn-enhancer='ready']", timeout=5000)
    assert page.evaluate("document.body.classList.contains('hn-dark')")
