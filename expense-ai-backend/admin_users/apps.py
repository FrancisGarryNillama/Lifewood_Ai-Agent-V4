from django.apps import AppConfig


class AdminUsersConfig(AppConfig):
    name = 'admin_users'

    def ready(self):
        # Seed predefined users via the management command, not during app startup.
        return
