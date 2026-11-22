from discovery.config import BACKEND, PATHS, SEED, load_config


def test_seed_is_42():
    assert SEED == 42 == load_config()["seed"]


def test_paths_point_inside_backend():
    for name in ("raw", "processed", "index", "eval"):
        assert PATHS[name].is_dir(), name
        assert PATHS[name].is_relative_to(BACKEND)
