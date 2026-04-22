from django.core.management.base import BaseCommand

from admin_users.predefined_users import sync_predefined_users


class Command(BaseCommand):
    help = 'Creates or updates the two Lifewood predefined admin accounts.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-password',
            action='store_true',
            help='Reset predefined passwords to their default values.',
        )

    def handle(self, *args, **options):
        force_pw = options.get('force_password', False)
        sync_predefined_users(force_password=force_pw)
        self.stdout.write(self.style.SUCCESS('Predefined users are ready.'))
