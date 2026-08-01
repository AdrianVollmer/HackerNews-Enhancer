# tests/test_hn_enhancer.py

def test_extension_initialises(hn_page):
    val = hn_page.evaluate("document.body.dataset.hnEnhancer")
    assert val == 'ready'
