from django.contrib.auth import get_user_model

from .models import AdminUserProfile


PREDEFINED_USERS = [
    {
        'username': 'lifewoodph.adminfinance',
        'password': '1234',
        'email': 'lifewoodph.finance@gmail.com',
        'role': 'admin',
    },
    {
        'username': 'lifewoodph.superadminfinance',
        'password': '12345',
        'email': 'lifewoodph.finance@gmail.com',
        'role': 'super_admin',
    },
]


def get_predefined_user_spec(username):
    username = (username or '').strip()
    if not username:
        return None

    for spec in PREDEFINED_USERS:
        if spec['username'] == username:
            return spec
    return None


def sync_predefined_users(force_password=False, usernames=None):
    """
    Create or refresh the predefined Lifewood accounts.

    When force_password is False, existing users keep their current password.
    New users always receive the predefined password.
    """
    user_model = get_user_model()
    wanted = {
        username.strip()
        for username in (usernames or [])
        if username and username.strip()
    }

    synced = []
    for spec in PREDEFINED_USERS:
        if wanted and spec['username'] not in wanted:
            continue

        user, created = user_model.objects.get_or_create(
            username=spec['username'],
            defaults={'email': spec['email'], 'is_active': True},
        )

        changed = created

        if user.email != spec['email']:
            user.email = spec['email']
            changed = True

        if not user.is_active:
            user.is_active = True
            changed = True

        if created or force_password:
            user.set_password(spec['password'])
            changed = True

        if changed:
            user.save()

        profile, _ = AdminUserProfile.objects.get_or_create(user=user)
        profile_changed = False

        if profile.role != spec['role']:
            profile.role = spec['role']
            profile_changed = True

        if not profile.is_predefined:
            profile.is_predefined = True
            profile_changed = True

        if not profile.use_shared_google_drive:
            profile.use_shared_google_drive = True
            profile_changed = True

        if profile_changed:
            profile.save()

        synced.append((user, created))

    return synced


def ensure_predefined_user(username):
    spec = get_predefined_user_spec(username)
    if spec is None:
        return None, False

    synced = sync_predefined_users(
        force_password=False,
        usernames=[spec['username']],
    )
    return synced[0] if synced else (None, False)
