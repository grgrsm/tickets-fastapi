from app.services import pricing
from app.services.booking_service import validate_participants
from app.exceptions import BookingRuleViolation
import pytest


def test_adult_gets_full_ticket():
    assert pricing.classify(30) == pricing.PricedTicket("full", 2000)


def test_age_13_child_ticket():
    assert pricing.classify(13) == pricing.PricedTicket("child", 1000)


def test_age_14_full_ticket():
    assert pricing.classify(14) == pricing.PricedTicket("full", 2000)


def test_child_without_adult_rejected():
    with pytest.raises(BookingRuleViolation):
        validate_participants([10])


def test_child_with_adult_accepted():
    validate_participants([10, 18])


def test_17_year_old_is_not_an_adult():
    with pytest.raises(BookingRuleViolation):
        validate_participants([10, 17])


def test_teenagers_do_not_need_adult():
    validate_participants([14, 17])


def test_participant_count_limits():
    with pytest.raises(BookingRuleViolation):
        validate_participants([])
    with pytest.raises(BookingRuleViolation):
        validate_participants([30] * 5)
