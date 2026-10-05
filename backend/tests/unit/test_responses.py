from app.core.responses import PageParams, ok, paginated


def test_ok_envelope() -> None:
    assert ok({"a": 1}).model_dump() == {"success": True, "data": {"a": 1}}


def test_paginated_meta() -> None:
    params = PageParams(page=2, page_size=20)
    body = paginated([1, 2], total=41, params=params).model_dump()
    assert body["meta"] == {"page": 2, "page_size": 20, "total": 41, "total_pages": 3}
    assert params.offset == 20


def test_paginated_empty() -> None:
    body = paginated([], total=0, params=PageParams()).model_dump()
    assert body["meta"]["total_pages"] == 0
