from app.utils.youtube_parsing import parse_channel_url


# def test_parse_channel_url_channel():
#     cid, handle, username = parse_channel_url("https://www.youtube.com/channel/UC123456789")
#     assert cid == "UC123456789"
#     assert handle is None
#     assert username is None


def test_parse_channel_url_handle():
    cid, handle, username = parse_channel_url("https://www.youtube.com/@ChandrKathaByJyoti")
    assert cid is None
    assert handle == "@ChandrKathaByJyoti"
    assert username is None


# def test_parse_channel_url_user():
#     cid, handle, username = parse_channel_url("https://www.youtube.com/user/olduser")
#     assert cid is None
#     assert handle is None
#     assert username == "olduser"