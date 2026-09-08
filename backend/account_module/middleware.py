# account_module/middleware.py
"""
Middleware تشخیص دانشگاه (Tenant) بر اساس زیردامنه‌ی درخواست.

مثال:
    eng.example.com      -> request.tenant = University(subdomain='eng')
    example.com          -> request.tenant = None   (دامنه اصلی، پنل سوپروایزر)
    localhost:8000        -> request.tenant = None   (برای توسعه؛ می‌توان با
                             هدر X-Tenant-Subdomain تست کرد)
"""
from django.http import JsonResponse
from django.conf import settings

from .models import University


# دامنه‌های پایه‌ای که زیردامنه محسوب نمی‌شوند (سایت اصلی/پنل سوپروایزر)
BASE_HOSTS = set(getattr(settings, 'TENANT_BASE_HOSTS', [
    'localhost', '127.0.0.1',
]))


def _extract_subdomain(host):
    """
    از هاست هدر، زیردامنه را استخراج می‌کند.
    'eng.example.com' -> 'eng'
    'example.com'      -> None
    'localhost:8000'   -> None
    """
    host = host.split(':')[0].lower().strip()

    if host in BASE_HOSTS:
        return None

    parts = host.split('.')

    # eng.example.com -> ['eng', 'example', 'com'] -> subdomain = 'eng'
    # example.com     -> ['example', 'com']         -> no subdomain
    if len(parts) >= 3:
        return parts[0]

    # حالت توسعه: eng.localhost -> ['eng', 'localhost']
    if len(parts) == 2 and parts[1] in ('localhost',):
        return parts[0]

    return None


class TenantMiddleware:
    """
    این middleware باید بعد از CorsMiddleware و قبل از AuthenticationMiddleware
    در MIDDLEWARE قرار بگیرد تا request.tenant برای ویوها/سریالایزرها آماده باشد.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        subdomain = None

        # برای تست/توسعه: هدر صریح روی درخواست ارجحیت دارد
        header_subdomain = request.headers.get('X-Tenant-Subdomain')
        if header_subdomain:
            subdomain = header_subdomain.lower().strip()
        else:
            host = request.get_host()
            subdomain = _extract_subdomain(host)

        request.tenant = None
        request.tenant_subdomain = subdomain

        if subdomain:
            try:
                university = University.objects.get(subdomain=subdomain)
            except University.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'دانشگاهی با این زیردامنه یافت نشد.'
                }, status=404)

            if not university.is_active:
                return JsonResponse({
                    'success': False,
                    'message': 'دسترسی این دانشگاه غیرفعال شده است. لطفاً با پشتیبانی تماس بگیرید.'
                }, status=403)

            if university.is_expired:
                return JsonResponse({
                    'success': False,
                    'message': 'مدت اعتبار دسترسی این دانشگاه به پایان رسیده است. لطفاً با پشتیبانی تماس بگیرید.'
                }, status=403)

            request.tenant = university

        return self.get_response(request)
