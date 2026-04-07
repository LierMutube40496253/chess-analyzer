import unittest
from src.analyzer import GameAnalyzer

class TestGameAnalyzer(unittest.TestCase):

    def setUp(self):
        self.analyzer = GameAnalyzer()

    def test_analyze_game_good_move(self):
        game_data = {
            'moves': ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6'],
            'result': '1-0'
        }
        feedback = self.analyzer.analyze_game(game_data)
        self.assertIn('good choice', feedback)

    def test_analyze_game_bad_move(self):
        game_data = {
            'moves': ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'e5'],
            'result': '0-1'
        }
        feedback = self.analyzer.analyze_game(game_data)
        self.assertIn('not a good choice', feedback)

    def test_analyze_game_alternatives(self):
        game_data = {
            'moves': ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6'],
            'result': '1-0'
        }
        feedback = self.analyzer.analyze_game(game_data)
        self.assertIn('alternative moves', feedback)

if __name__ == '__main__':
    unittest.main()