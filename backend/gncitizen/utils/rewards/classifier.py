from typing import Any, List, Union
from rule import Rule


# https://web.uvic.ca/~maryam/DMSpring94/Slides/4_rules.pdf
# Data processing != Decision processing
#
# Desiderata for Rule-Based Classifier
# • Mutually exclusive rules
#   – No two rules are triggered by the same record.
#   – This ensures that every record is covered by at most one rule.
# • Exhaustive rules
#   – There exists a rule for each combination of attribute values.
#   – This ensures that every record is covered by at least one rule.
# Together these properties ensure that every record is covered by
# exactly one rule.
#
# Values have been discretized to reduce the problem into
# a binary classification problem


def find_match(rules: List[Rule], body: Any) -> List[Rule]:
    return [rule for rule in rules if rule.matches(body)]


class Classifier:
    @staticmethod
    def tag(ruleset, search_body) -> Union[List[str], None]:
        matching_rules = find_match(ruleset, search_body)
        if matching_rules:
            return [rule.action(search_body) for rule in matching_rules]
        else:
            return None
