"""Hand-checked metric examples. Remove the skip marks as each metric is implemented."""

import pytest

from discovery.evaluation import metrics

RANKED = ["a", "b", "c", "d", "e"]
QRELS = {"a": 2, "c": 1, "f": 2}   # f is relevant but not retrieved


@pytest.mark.skip(reason="not implemented yet")
def test_precision_at_5():
    assert metrics.precision_at_k(RANKED, QRELS, 5) == pytest.approx(2 / 5)


@pytest.mark.skip(reason="not implemented yet")
def test_recall_at_5():
    assert metrics.recall_at_k(RANKED, QRELS, 5) == pytest.approx(2 / 3)


@pytest.mark.skip(reason="not implemented yet")
def test_average_precision():
    # relevant at ranks 1 and 3: (1/1 + 2/3) / 3 relevant docs
    assert metrics.average_precision(RANKED, QRELS) == pytest.approx((1 + 2 / 3) / 3)
