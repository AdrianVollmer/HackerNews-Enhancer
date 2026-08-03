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


def test_slider_exists(hn_page: Page) -> None:
    assert hn_page.locator('#hn-age-slider').count() == 1

def test_slider_range_matches_comment_timestamps(hn_page: Page) -> None:
    min_val = int(hn_page.evaluate("document.getElementById('hn-age-slider').min"))
    max_val = int(hn_page.evaluate("document.getElementById('hn-age-slider').max"))
    assert min_val > 0
    assert max_val > min_val

def test_slider_default_no_highlight(hn_page: Page) -> None:
    count = hn_page.evaluate(
        "document.querySelectorAll('tr.hn-new-comment').length"
    )
    assert count == 0

def test_slider_moved_left_highlights_newer_comments(hn_page: Page) -> None:
    hn_page.evaluate("""
        const s = document.getElementById('hn-age-slider');
        s.value = s.min;
        s.dispatchEvent(new Event('input'));
    """)
    count = hn_page.evaluate(
        "document.querySelectorAll('tr.hn-new-comment').length"
    )
    assert count > 0

def test_slider_display_updates(hn_page: Page) -> None:
    hn_page.evaluate("""
        const s = document.getElementById('hn-age-slider');
        s.value = s.min;
        s.dispatchEvent(new Event('input'));
    """)
    text = hn_page.locator('#hn-slider-display').inner_text()
    assert 'Newer than' in text

def test_slider_at_max_clears_highlights(hn_page: Page) -> None:
    hn_page.evaluate("""
        const s = document.getElementById('hn-age-slider');
        s.value = s.min;
        s.dispatchEvent(new Event('input'));
        s.value = s.max;
        s.dispatchEvent(new Event('input'));
    """)
    count = hn_page.evaluate(
        "document.querySelectorAll('tr.hn-new-comment').length"
    )
    assert count == 0

def test_collapse_bars_rendered(hn_page: Page) -> None:
    count = hn_page.evaluate("document.querySelectorAll('.hn-cbar').length")
    assert count > 0

def test_native_toggle_hidden(hn_page: Page) -> None:
    visible = hn_page.evaluate("""
        Array.from(document.querySelectorAll('a.togg'))
            .some(el => el.offsetParent !== null)
    """)
    assert not visible

def test_collapse_hides_children(hn_page: Page) -> None:
    first_bar = hn_page.locator('.hn-cbar').first
    first_bar.click()
    hn_page.wait_for_timeout(100)
    hidden = hn_page.evaluate(
        "document.querySelectorAll('tr.hn-hidden').length"
    )
    assert hidden > 0

def test_expand_shows_children(hn_page: Page) -> None:
    first_bar = hn_page.locator('.hn-cbar').first
    first_bar.click()
    hn_page.wait_for_timeout(100)
    collapsed_bar = hn_page.locator('.hn-cbar.hn-collapsed').first
    collapsed_bar.click()
    hn_page.wait_for_timeout(100)
    hidden = hn_page.evaluate(
        "document.querySelectorAll('tr.hn-hidden').length"
    )
    assert hidden == 0

def test_collapsed_bar_shows_count(hn_page: Page) -> None:
    first_bar = hn_page.locator('.hn-cbar').first
    first_bar.click()
    hn_page.wait_for_timeout(100)
    label = hn_page.locator('.hn-cbar-count').first
    text = label.inner_text()
    assert text.startswith('+')
    assert int(text[1:]) > 0
