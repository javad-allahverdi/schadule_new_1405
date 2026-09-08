# account_module/views.py
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.views.decorators.debug import sensitive_post_parameters
from django.http import JsonResponse
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models

# Django REST Framework
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST

from .forms import (
    CustomUserCreationForm, CustomAuthenticationForm, 
    UserProfileForm, PasswordChangeForm
)
from .serializers import (
    RegisterSerializer, UserListSerializer, UserSerializer, 
    UserProfileSerializer, ChangePasswordSerializer, UserUpdateSerializer
)
from .models import UserProfile, CustomUser, University
from .serializers import UniversitySerializer, UniversityCreateSerializer


# ============================================
# Views سنتی (برای رابط وب)
# ============================================

@method_decorator([never_cache, csrf_protect], name='dispatch')
class RegisterView(View):
    def get(self, request):
        if request.user.is_authenticated:
            return redirect('dashboard')
        form = CustomUserCreationForm()
        return render(request, 'account_module/register.html', {'form': form})

    @method_decorator(sensitive_post_parameters('password1', 'password2'))
    def post(self, request):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            messages.error(request, 'ثبت‌نام فقط از طریق زیردامنه‌ی دانشگاه امکان‌پذیر است.')
            return render(request, 'account_module/register.html', {'form': CustomUserCreationForm()})

        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            if form.cleaned_data.get('role') not in ('teacher', 'education_officer'):
                messages.error(request, 'ثبت‌نام عمومی فقط برای استاد یا مسئول آموزش مجاز است.')
                return render(request, 'account_module/register.html', {'form': form})

            with transaction.atomic():
                user = form.save(commit=False)
                user.university = tenant
                user.save()
                UserProfile.objects.create(user=user)

            messages.success(request, 'حساب کاربری با موفقیت ایجاد شد. لطفا وارد شوید.')
            return redirect('login')
        
        return render(request, 'account_module/register.html', {'form': form})


# account_module/views.py

@method_decorator([never_cache, csrf_protect], name='dispatch')
class LoginView(View):
    def get(self, request):
        if request.user.is_authenticated:
            return redirect('dashboard')
        form = CustomAuthenticationForm()
        return render(request, 'account_module/login.html', {'form': form})

    @method_decorator(sensitive_post_parameters('password'))
    def post(self, request):
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            
            if user is not None:
                tenant = getattr(request, 'tenant', None)
                if user.role != 'supervisor' and (not tenant or user.university_id != tenant.id):
                    messages.error(request, 'این حساب کاربری متعلق به این دانشگاه نیست.')
                    return render(request, 'account_module/login.html', {'form': form})
                if user.role != 'supervisor' and user.university and not user.university.is_accessible:
                    messages.error(request, 'اعتبار دسترسی دانشگاه شما به پایان رسیده یا غیرفعال شده است.')
                    return render(request, 'account_module/login.html', {'form': form})

                if user.is_active and not user.is_locked_out():
                    login(request, user)
                    user.reset_failed_logins()
                    messages.success(request, f'خوش آمدید {user.get_full_name()}!')
                    
                    # مسیردهی بر اساس نقش کاربر
                    if user.role == 'teacher':
                        return redirect('teacher_dashboard')
                    elif user.role == 'admin':
                        return redirect('admin_dashboard')
                    elif user.role == 'education_officer':
                        return redirect('education_officer_dashboard')
                    elif user.role == 'supervisor':
                        return redirect('supervisor_dashboard')
                    else:
                        return redirect('dashboard')
                else:
                    if user.is_locked_out():
                        messages.error(request, 'حساب شما قفل شده است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.')
                    else:
                        messages.error(request, 'حساب کاربری غیرفعال است.')
            else:
                try:
                    user = CustomUser.objects.get(
                        models.Q(username=username) | 
                        models.Q(email=username)
                    )
                    user.increment_failed_login()
                    
                    if user.is_locked_out():
                        messages.error(request, 'حساب شما قفل شده است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.')
                    else:
                        attempts_left = 5 - user.failed_login_attempts
                        messages.error(
                            request, 
                            f'نام کاربری یا رمز عبور نادرست است. {attempts_left} تلاش باقی مانده.'
                        )
                except CustomUser.DoesNotExist:
                    messages.error(request, 'نام کاربری یا رمز عبور نادرست است.')
        
        return render(request, 'account_module/login.html', {'form': form})

class LogoutView(View):
    @method_decorator(never_cache)
    def get(self, request):
        logout(request)
        messages.success(request, 'با موفقیت خارج شدید.')
        return redirect('login')


@login_required
@never_cache
def profile_view(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        form = UserProfileForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'پروفایل با موفقیت به روز شد.')
            return redirect('profile')
    else:
        form = UserProfileForm(instance=profile)

    return render(request, 'account_module/profile.html', {'form': form})


@login_required
@require_POST
@csrf_protect
def change_password_view(request):
    form = PasswordChangeForm(request.user, request.POST)
    
    if form.is_valid():
        user = request.user
        new_password = form.cleaned_data['new_password1']
        user.set_password(new_password)
        user.last_password_change = timezone.now()
        user.save()
        
        update_session_auth_hash(request, user)
        messages.success(request, 'رمز عبور با موفقیت تغییر یافت.')
        return redirect('profile')
    else:
        for error in form.errors.values():
            messages.error(request, error)
        return redirect('profile')


# ============================================
# API Views (برای React با JWT) - بدون CSRF
# ============================================

class APIRegisterView(APIView):
    """
    ثبت‌نام عمومی فقط از طریق زیردامنه‌ی یک دانشگاه معتبر مجاز است،
    و فقط برای نقش‌های استاد/مسئول آموزش (نه مدیر و نه سوپروایزر).
    ایجاد دانشگاه و مدیر آن، وظیفه‌ی سوپروایزر است (APIUniversityViewSet).
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            tenant = getattr(request, 'tenant', None)
            if not tenant:
                return Response({
                    'success': False,
                    'message': 'ثبت‌نام فقط از طریق زیردامنه‌ی اختصاصی دانشگاه شما امکان‌پذیر است.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not tenant.is_accessible:
                return Response({
                    'success': False,
                    'message': 'اعتبار دسترسی این دانشگاه به پایان رسیده یا غیرفعال شده است.'
                }, status=status.HTTP_403_FORBIDDEN)

            requested_role = request.data.get('role', 'teacher')
            if requested_role not in ('teacher', 'education_officer'):
                return Response({
                    'success': False,
                    'message': 'ثبت‌نام عمومی فقط برای نقش استاد یا مسئول آموزش مجاز است.'
                }, status=status.HTTP_400_BAD_REQUEST)

            if tenant.members.count() >= tenant.max_users:
                return Response({
                    'success': False,
                    'message': 'ظرفیت تعداد کاربران این دانشگاه تکمیل شده است.'
                }, status=status.HTTP_400_BAD_REQUEST)

            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                with transaction.atomic():
                    user = serializer.save(university=tenant)

                refresh = RefreshToken.for_user(user)
                user_serializer = UserSerializer(user)
                
                return Response({
                    'success': True,
                    'message': 'ثبت نام با موفقیت انجام شد',
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    },
                    'user': user_serializer.data
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'message': 'خطا در اعتبارسنجی',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در ثبت نام: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APILoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            if not username or not password:
                return Response({
                    'success': False,
                    'message': 'نام کاربری و رمز عبور الزامی هستند'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = CustomUser.objects.get(
                    models.Q(username=username) | 
                    models.Q(email=username)
                )
            except CustomUser.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'نام کاربری یا رمز عبور نادرست است'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if user.is_locked_out():
                return Response({
                    'success': False,
                    'message': 'حساب شما به دلیل تلاش‌های ناموفق قفل شده است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.'
                }, status=status.HTTP_423_LOCKED)

            tenant = getattr(request, 'tenant', None)
            if user.role != 'supervisor':
                if not tenant or user.university_id != tenant.id:
                    return Response({
                        'success': False,
                        'message': 'این حساب کاربری متعلق به این دانشگاه نیست'
                    }, status=status.HTTP_403_FORBIDDEN)
                if user.university and not user.university.is_accessible:
                    return Response({
                        'success': False,
                        'message': 'اعتبار دسترسی دانشگاه شما به پایان رسیده یا غیرفعال شده است'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            auth_user = authenticate(username=user.username, password=password)
            
            if auth_user is not None and auth_user.is_active:
                user.reset_failed_logins()
                refresh = RefreshToken.for_user(auth_user)
                user_serializer = UserSerializer(auth_user)
                
                return Response({
                    'success': True,
                    'message': 'ورود موفقیت‌آمیز',
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    },
                    'user': user_serializer.data
                })
            else:
                user.increment_failed_login()
                attempts_left = 5 - user.failed_login_attempts
                
                if attempts_left > 0:
                    message = f'نام کاربری یا رمز عبور نادرست است. {attempts_left} تلاش باقی مانده.'
                else:
                    message = 'حساب شما قفل شده است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.'
                
                return Response({
                    'success': False,
                    'message': message
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در ورود: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# account_module/views.py

class APILogoutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # حذف توکن از سمت کلاینت توسط فرانت‌اند انجام می‌شود
            return Response({
                'success': True,
                'message': 'خروج موفقیت‌آمیز'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در خروج: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class APIRefreshTokenView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response({
                    'success': False,
                    'message': 'توکن رفرش الزامی است'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            refresh = RefreshToken(refresh_token)
            
            return Response({
                'success': True,
                'access': str(refresh.access_token),
            })
            
        except (TokenError, InvalidToken):
            return Response({
                'success': False,
                'message': 'توکن نامعتبر یا منقضی شده است'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در تازه‌سازی توکن: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            user_serializer = UserSerializer(user)
            profile_serializer = UserProfileSerializer(profile)
            
            return Response({
                'success': True,
                'user': user_serializer.data,
                'profile': profile_serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در دریافت پروفایل: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request):
        try:
            user = request.user
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # به‌روزرسانی اطلاعات کاربر
            user_data = {}
            for field in ['first_name', 'last_name', 'email', 'phone_number', 'department', 'gender']:
                if field in request.data:
                    user_data[field] = request.data[field]
            
            if user_data:
                user_serializer = UserSerializer(user, data=user_data, partial=True)
                if user_serializer.is_valid():
                    user_serializer.save()
                else:
                    return Response({
                        'success': False,
                        'message': 'خطا در اعتبارسنجی داده‌های کاربر',
                        'errors': user_serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # به‌روزرسانی پروفایل
            profile_serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                return Response({
                    'success': False,
                    'message': 'خطا در اعتبارسنجی داده‌های پروفایل',
                    'errors': profile_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'success': True,
                'message': 'پروفایل با موفقیت به‌روز شد'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در به‌روزرسانی پروفایل: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIChangePasswordView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = ChangePasswordSerializer(data=request.data)
            if serializer.is_valid():
                user = request.user
                
                if not user.check_password(serializer.validated_data['current_password']):
                    return Response({
                        'success': False,
                        'message': 'رمز عبور فعلی نادرست است'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                user.set_password(serializer.validated_data['new_password'])
                user.last_password_change = timezone.now()
                user.save()
                
                return Response({
                    'success': True,
                    'message': 'رمز عبور با موفقیت تغییر یافت'
                })
            
            return Response({
                'success': False,
                'message': 'خطا در تغییر رمز عبور',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در تغییر رمز عبور: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIUserPermissionsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            return Response({
                'success': True,
                'permissions': user.get_permissions(),
                'role': user.role,
                'role_display': user.get_role_display()
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در دریافت مجوزها: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIValidateTokenView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_serializer = UserSerializer(user)
            
            return Response({
                'success': True,
                'valid': True,
                'user': user_serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'valid': False,
                'message': f'توکن نامعتبر: {str(e)}'
            }, status=status.HTTP_401_UNAUTHORIZED)


# account_module/views.py (ادامه)

# ============================================
# API Views جدید برای داشبورد و مدیریت کاربران
# ============================================
# account_module/views.py

# account_module/views.py - بررسی کنید این Viewها وجود داشته باشند

class APIDashboardStatsView(APIView):
    """دریافت آمار داشبورد"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            queryset = CustomUser.objects.all()
            if user.role != 'supervisor':
                queryset = queryset.filter(university=user.university)

            total_users = queryset.count()
            total_teachers = queryset.filter(role='teacher').count()
            total_education_officers = queryset.filter(role='education_officer').count()
            total_admins = queryset.filter(role='admin').count()

            active_users = queryset.filter(is_active=True).count()
            verified_users = queryset.filter(is_verified=True).count()

            from django.utils import timezone
            from datetime import timedelta
            last_week = timezone.now() - timedelta(days=7)
            new_users = queryset.filter(date_joined__gte=last_week).count()

            stats = {
                'total_users': total_users,
                'total_teachers': total_teachers,
                'total_education_officers': total_education_officers,
                'total_admins': total_admins,
                'active_users': active_users,
                'verified_users': verified_users,
                'new_users': new_users,
            }

            if user.role == 'supervisor':
                stats['total_universities'] = University.objects.count()
                stats['active_universities'] = University.objects.filter(is_active=True).count()
            
            return Response({
                'success': True,
                'stats': stats,
                'user': {
                    'role': user.role,
                    'role_display': user.get_role_display(),
                    'name': user.get_full_name(),
                    'university': user.university.name if user.university else None,
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در دریافت آمار: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# account_module/views.py
class APISupervisorDashboardView(APIView):
    """داشبورد مخصوص سوپروایزر"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            if request.user.role != 'supervisor':
                return Response({
                    'success': False,
                    'message': 'شما دسترسی به این بخش ندارید'
                }, status=status.HTTP_403_FORBIDDEN)

            from django.utils import timezone
            from datetime import timedelta

            now = timezone.now()
            soon = now + timedelta(days=14)

            universities = University.objects.all()
            expiring_soon = universities.filter(
                is_active=True, valid_until__isnull=False, valid_until__gte=now, valid_until__lte=soon
            ).count()
            expired = universities.filter(valid_until__isnull=False, valid_until__lt=now).count()

            return Response({
                'success': True,
                'stats': {
                    'total_universities': universities.count(),
                    'active_universities': universities.filter(is_active=True).count(),
                    'inactive_universities': universities.filter(is_active=False).count(),
                    'expiring_soon': expiring_soon,
                    'expired': expired,
                    'total_admins': CustomUser.objects.filter(role='admin').count(),
                    'total_education_officers': CustomUser.objects.filter(role='education_officer').count(),
                    'total_teachers': CustomUser.objects.filter(role='teacher').count(),
                    'total_users': CustomUser.objects.count(),
                },
                'recent_universities': UniversitySerializer(
                    universities.order_by('-created_at')[:5], many=True
                ).data,
                'user': {
                    'role': request.user.role,
                    'role_display': request.user.get_role_display(),
                    'name': request.user.get_full_name(),
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در دریافت آمار داشبورد: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class APIUserListView(APIView):
    """دریافت لیست کاربران با فیلتر و جستجو"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # نقش‌هایی که می‌توانند لیست کاربران را ببینند
            allowed_roles = ['admin', 'education_officer', 'supervisor']
            
            if request.user.role not in allowed_roles:
                return Response({
                    'success': False,
                    'message': 'شما دسترسی به این بخش ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # دریافت پارامترهای فیلتر
            role = request.query_params.get('role', None)
            search = request.query_params.get('search', None)
            is_active = request.query_params.get('is_active', None)
            is_verified = request.query_params.get('is_verified', None)
            university_id = request.query_params.get('university', None)
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            # ساخت کوئری
            queryset = CustomUser.objects.all().order_by('-date_joined')
            
            # سوپروایزر دسترسی کامل به همه دانشگاه‌ها دارد؛
            # سایر نقش‌ها (مدیر/مسئول آموزش) فقط کاربران دانشگاه خودشان را می‌بینند
            if request.user.role == 'supervisor':
                if university_id:
                    queryset = queryset.filter(university_id=university_id)
            else:
                queryset = queryset.filter(university=request.user.university)
            
            # اعمال فیلترها
            if role:
                queryset = queryset.filter(role=role)
            
            if is_active is not None:
                is_active_bool = is_active.lower() == 'true'
                queryset = queryset.filter(is_active=is_active_bool)
            
            if is_verified is not None:
                is_verified_bool = is_verified.lower() == 'true'
                queryset = queryset.filter(is_verified=is_verified_bool)
            
            if search:
                queryset = queryset.filter(
                    models.Q(username__icontains=search) |
                    models.Q(first_name__icontains=search) |
                    models.Q(last_name__icontains=search) |
                    models.Q(email__icontains=search) |
                    models.Q(national_code__icontains=search) |
                    models.Q(phone_number__icontains=search)
                )
            
            # محاسبه تعداد کل
            total = queryset.count()
            
            # پیجینیشن
            start = (page - 1) * page_size
            end = start + page_size
            queryset = queryset[start:end]
            
            # سریالایز کردن
            serializer = UserListSerializer(queryset, many=True)
            
            return Response({
                'success': True,
                'users': serializer.data,
                'pagination': {
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': (total + page_size - 1) // page_size,
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در دریافت لیست کاربران: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class APIAdminSetPasswordView(APIView):
    """
    تغییر دستی رمز عبور یک کاربر توسط مدیر/سوپروایزر، بدون نیاز به دانستن رمز فعلی.
    برای وقتی که کاربری (مثلاً استاد) رمز خود را فراموش کرده است.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        try:
            if request.user.role not in ('admin', 'supervisor'):
                return Response({
                    'success': False,
                    'message': 'شما دسترسی تغییر رمز عبور کاربران دیگر را ندارید'
                }, status=status.HTTP_403_FORBIDDEN)

            try:
                target_user = CustomUser.objects.get(id=user_id)
            except CustomUser.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'کاربر یافت نشد'
                }, status=status.HTTP_404_NOT_FOUND)

            if request.user.role != 'supervisor' and target_user.university_id != request.user.university_id:
                return Response({
                    'success': False,
                    'message': 'شما به این کاربر دسترسی ندارید'
                }, status=status.HTTP_403_FORBIDDEN)

            new_password = request.data.get('new_password', '')
            if len(new_password) < 8:
                return Response({
                    'success': False,
                    'message': 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                validate_password(new_password, user=target_user)
            except DjangoValidationError as e:
                return Response({
                    'success': False,
                    'message': ' '.join(e.messages)
                }, status=status.HTTP_400_BAD_REQUEST)

            target_user.set_password(new_password)
            target_user.save(update_fields=['password'])

            return Response({
                'success': True,
                'message': f'رمز عبور «{target_user.get_full_name() or target_user.username}» با موفقیت تغییر یافت'
            })

        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در تغییر رمز عبور: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIUserDetailView(APIView):
    """دریافت، ویرایش و حذف کاربر"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return None

    def check_permission(self, request):
        """بررسی مجوز دسترسی"""
        allowed_roles = ['admin', 'education_officer', 'supervisor']
        return request.user.role in allowed_roles

    def check_scope(self, request, user):
        """سوپروایزر به همه دسترسی دارد؛ بقیه فقط به کاربران دانشگاه خودشان"""
        if request.user.role == 'supervisor':
            return True
        return user.university_id == request.user.university_id

    def get(self, request, user_id):
        try:
            # بررسی دسترسی
            if not self.check_permission(request):
                return Response({
                    'success': False,
                    'message': 'شما دسترسی به این بخش ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            user = self.get_user(user_id)
            if not user:
                return Response({
                    'success': False,
                    'message': 'کاربر یافت نشد'
                }, status=status.HTTP_404_NOT_FOUND)

            if not self.check_scope(request, user):
                return Response({
                    'success': False,
                    'message': 'شما به اطلاعات این کاربر دسترسی ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = UserSerializer(user)
            return Response({
                'success': True,
                'user': serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در دریافت اطلاعات کاربر: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, user_id):
        try:
            # مدیر دانشگاه یا سوپروایزر می‌توانند ویرایش کنند
            if request.user.role not in ['admin', 'supervisor']:
                return Response({
                    'success': False,
                    'message': 'شما دسترسی به این بخش ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            user = self.get_user(user_id)
            if not user:
                return Response({
                    'success': False,
                    'message': 'کاربر یافت نشد'
                }, status=status.HTTP_404_NOT_FOUND)

            if not self.check_scope(request, user):
                return Response({
                    'success': False,
                    'message': 'شما به اطلاعات این کاربر دسترسی ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = UserUpdateSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'اطلاعات کاربر با موفقیت به‌روز شد',
                    'user': serializer.data
                })
            
            return Response({
                'success': False,
                'message': 'خطا در اعتبارسنجی',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در به‌روزرسانی کاربر: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, user_id):
        try:
            # فقط مدیر دانشگاه یا سوپروایزر می‌توانند حذف کنند
            if request.user.role not in ['admin', 'supervisor']:
                return Response({
                    'success': False,
                    'message': 'شما دسترسی به این بخش ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # جلوگیری از حذف خود
            if request.user.id == user_id:
                return Response({
                    'success': False,
                    'message': 'شما نمی‌توانید خودتان را حذف کنید'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = self.get_user(user_id)
            if not user:
                return Response({
                    'success': False,
                    'message': 'کاربر یافت نشد'
                }, status=status.HTTP_404_NOT_FOUND)

            if not self.check_scope(request, user):
                return Response({
                    'success': False,
                    'message': 'شما به این کاربر دسترسی ندارید'
                }, status=status.HTTP_403_FORBIDDEN)
            
            user.delete()
            return Response({
                'success': True,
                'message': 'کاربر با موفقیت حذف شد'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در حذف کاربر: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class APICreateUserView(APIView):
    """ایجاد کاربر جدید توسط مدیر"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # مدیر دانشگاه، مسئول آموزش یا سوپروایزر می‌توانند کاربر ایجاد کنند
            if request.user.role not in ['admin', 'education_officer', 'supervisor']:
                return Response({
                    'success': False,
                    'message': 'شما دسترسی به این بخش ندارید'
                }, status=status.HTTP_403_FORBIDDEN)

            data = request.data.copy()

            if request.user.role == 'supervisor':
                # سوپروایزر باید دانشگاه مقصد را صراحتاً مشخص کند
                target_university_id = data.get('university')
                if not target_university_id:
                    return Response({
                        'success': False,
                        'message': 'برای ایجاد کاربر توسط سوپروایزر، انتخاب دانشگاه الزامی است'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # مدیر/مسئول آموزش فقط می‌توانند برای دانشگاه خودشان کاربر بسازند
                data['university'] = request.user.university_id
                if data.get('role') not in ('teacher', 'education_officer') and request.user.role != 'admin':
                    return Response({
                        'success': False,
                        'message': 'شما فقط می‌توانید حساب استاد ایجاد کنید'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = RegisterSerializer(data=data)
            if serializer.is_valid():
                user = serializer.save()
                return Response({
                    'success': True,
                    'message': 'کاربر با موفقیت ایجاد شد',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'message': 'خطا در اعتبارسنجی',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در ایجاد کاربر: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============================================
# مدیریت دانشگاه‌ها (Tenant) - فقط سوپروایزر
# ============================================

class APIPublicUniversityListView(APIView):
    """
    لیست عمومیِ (بدون نیاز به احراز هویت) دانشگاه‌های فعال، فقط شامل نام و
    زیردامنه. برای نمایش «دانشگاه خود را انتخاب کنید» در صفحه‌ی ورود/ثبت‌نام
    استفاده می‌شود (مخصوصاً وقتی از localhost یا دامنه‌ی اصلی بدون زیردامنه
    استفاده می‌شود و امکان تشخیص خودکار دانشگاه از روی هاست وجود ندارد).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        universities = University.objects.filter(is_active=True).order_by('name')
        data = [
            {
                'id': u.id,
                'name': u.name,
                'subdomain': u.subdomain,
                'is_accessible': u.is_accessible,
            }
            for u in universities
        ]
        return Response({'success': True, 'universities': data})


class APIUniversityListCreateView(APIView):
    """
    لیست/ایجاد دانشگاه‌ها.
    - سوپروایزر: می‌تواند همه‌ی دانشگاه‌ها را ببیند و دانشگاه جدید (با زیردامنه و مدت اعتبار) ایجاد کند.
    - مدیر/مسئول آموزش/استاد: فقط اطلاعات دانشگاه خودشان را در قالب یک آیتم می‌بینند.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            if request.user.role == 'supervisor':
                queryset = University.objects.all().order_by('-created_at')

                search = request.query_params.get('search')
                if search:
                    queryset = queryset.filter(
                        models.Q(name__icontains=search) | models.Q(subdomain__icontains=search)
                    )

                is_active = request.query_params.get('is_active')
                if is_active is not None:
                    queryset = queryset.filter(is_active=(is_active.lower() == 'true'))

                serializer = UniversitySerializer(queryset, many=True)
                return Response({'success': True, 'universities': serializer.data})

            if request.user.university:
                serializer = UniversitySerializer(request.user.university)
                return Response({'success': True, 'universities': [serializer.data]})

            return Response({'success': True, 'universities': []})

        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در دریافت لیست دانشگاه‌ها: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            if request.user.role != 'supervisor':
                return Response({
                    'success': False,
                    'message': 'فقط سوپروایزر می‌تواند دانشگاه جدید ایجاد کند'
                }, status=status.HTTP_403_FORBIDDEN)

            serializer = UniversityCreateSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                university = serializer.save()
                return Response({
                    'success': True,
                    'message': 'دانشگاه با موفقیت ایجاد شد',
                    'university': UniversitySerializer(university).data
                }, status=status.HTTP_201_CREATED)

            return Response({
                'success': False,
                'message': 'خطا در اعتبارسنجی',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در ایجاد دانشگاه: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIUniversityDetailView(APIView):
    """دریافت/ویرایش/حذف یک دانشگاه - فقط سوپروایزر می‌تواند subdomain و اعتبار را تغییر دهد"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_university(self, university_id):
        try:
            return University.objects.get(id=university_id)
        except University.DoesNotExist:
            return None

    def check_scope(self, request, university):
        if request.user.role == 'supervisor':
            return True
        return request.user.university_id == university.id

    def get(self, request, university_id):
        university = self.get_university(university_id)
        if not university:
            return Response({'success': False, 'message': 'دانشگاه یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        if not self.check_scope(request, university):
            return Response({'success': False, 'message': 'دسترسی ندارید'}, status=status.HTTP_403_FORBIDDEN)
        return Response({'success': True, 'university': UniversitySerializer(university).data})

    def put(self, request, university_id):
        university = self.get_university(university_id)
        if not university:
            return Response({'success': False, 'message': 'دانشگاه یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        if not self.check_scope(request, university):
            return Response({'success': False, 'message': 'دسترسی ندارید'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        if request.user.role != 'supervisor':
            # مدیر دانشگاه فقط می‌تواند اطلاعات تماس/لوگو را ویرایش کند،
            # نه زیردامنه، وضعیت فعال بودن یا مدت اعتبار را
            for locked_field in ['subdomain', 'is_active', 'valid_until', 'max_users']:
                data.pop(locked_field, None)

        serializer = UniversitySerializer(university, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'اطلاعات دانشگاه با موفقیت به‌روز شد',
                'university': serializer.data
            })

        return Response({
            'success': False,
            'message': 'خطا در اعتبارسنجی',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, university_id):
        if request.user.role != 'supervisor':
            return Response({
                'success': False,
                'message': 'فقط سوپروایزر می‌تواند دانشگاه را حذف کند'
            }, status=status.HTTP_403_FORBIDDEN)

        university = self.get_university(university_id)
        if not university:
            return Response({'success': False, 'message': 'دانشگاه یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

        name = university.name
        university.delete()
        return Response({'success': True, 'message': f'دانشگاه «{name}» با موفقیت حذف شد'})


class APIUniversityExtendAccessView(APIView):
    """تمدید یا تغییر مدت اعتبار دسترسی یک دانشگاه - فقط سوپروایزر"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, university_id):
        try:
            if request.user.role != 'supervisor':
                return Response({
                    'success': False,
                    'message': 'فقط سوپروایزر می‌تواند مدت اعتبار را تغییر دهد'
                }, status=status.HTTP_403_FORBIDDEN)

            try:
                university = University.objects.get(id=university_id)
            except University.DoesNotExist:
                return Response({'success': False, 'message': 'دانشگاه یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

            from django.utils import timezone
            from datetime import timedelta

            extend_days = request.data.get('extend_days')
            valid_until = request.data.get('valid_until')  # ISO date string, یا null برای نامحدود

            if extend_days is not None:
                base = university.valid_until if (university.valid_until and university.valid_until > timezone.now()) else timezone.now()
                university.valid_until = base + timedelta(days=int(extend_days))
            elif 'valid_until' in request.data:
                university.valid_until = valid_until  # None => نامحدود

            if 'is_active' in request.data:
                university.is_active = bool(request.data.get('is_active'))

            university.save()

            return Response({
                'success': True,
                'message': 'اعتبار دانشگاه به‌روز شد',
                'university': UniversitySerializer(university).data
            })

        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در تمدید اعتبار: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
