import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from admin_users.models import AdminUserProfile


class LoginViewTests(TestCase):
    def test_login_recreates_missing_predefined_super_admin(self):
        user_model = get_user_model()
        user_model.objects.filter(username='lifewoodph.superadminfinance').delete()

        response = self.client.post(
            '/api/users/login/',
            data=json.dumps({
                'username': 'lifewoodph.superadminfinance',
                'password': '12345',
            }),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)

        user = user_model.objects.get(username='lifewoodph.superadminfinance')
        self.assertTrue(user.check_password('12345'))

        profile = AdminUserProfile.objects.get(user=user)
        self.assertEqual(profile.role, 'super_admin')
        self.assertTrue(profile.is_predefined)
