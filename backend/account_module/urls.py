# account_module/urls.py
from django.urls import path
from . import views
from .views import (
    APIRegisterView, APILoginView, APILogoutView, 
    APIRefreshTokenView, APIProfileView, APIChangePasswordView,
    APIUserPermissionsView, APIValidateTokenView,
    APIDashboardStatsView,  # این import فراموش شده بود
    APIUserListView, APIUserDetailView,
    APICreateUserView, APISupervisorDashboardView,
    APIUniversityListCreateView, APIUniversityDetailView,
    APIUniversityExtendAccessView, APIPublicUniversityListView,
    APIAdminSetPasswordView,
)

app_name = 'account_module'

urlpatterns = [
    # ===================================
    # مسیرهای سنتی (برای رابط وب)
    # ===================================
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('change-password/', views.change_password_view, name='change_password'),
    
    # ===================================
    # مسیرهای API (برای React)
    # ===================================
    # احراز هویت
    path('api/register/', APIRegisterView.as_view(), name='api_register'),
    path('api/login/', APILoginView.as_view(), name='api_login'),
    path('api/logout/', APILogoutView.as_view(), name='api_logout'),
    path('api/refresh/', APIRefreshTokenView.as_view(), name='api_refresh'),
    path('api/validate-token/', APIValidateTokenView.as_view(), name='api_validate_token'),
    
    # پروفایل و مدیریت کاربر
    path('api/profile/', APIProfileView.as_view(), name='api_profile'),
    path('api/change-password/', APIChangePasswordView.as_view(), name='api_change_password'),
    path('api/permissions/', APIUserPermissionsView.as_view(), name='api_permissions'),
    
    # ===================================
    # مسیرهای داشبورد و مدیریت کاربران
    # ===================================
    # اضافه کردن این خط که فراموش شده بود
    path('api/dashboard/stats/', APIDashboardStatsView.as_view(), name='api_dashboard_stats'),
    path('api/supervisor/dashboard/', APISupervisorDashboardView.as_view(), name='api_supervisor_dashboard'),
    path('api/users/', APIUserListView.as_view(), name='api_user_list'),
    path('api/users/create/', APICreateUserView.as_view(), name='api_user_create'),
    path('api/users/<int:user_id>/', APIUserDetailView.as_view(), name='api_user_detail'),
    path('api/users/<int:user_id>/set-password/', APIAdminSetPasswordView.as_view(), name='api_user_set_password'),

    # ===================================
    # مدیریت دانشگاه‌ها (Tenant) - فقط سوپروایزر
    # ===================================
    path('api/universities/', APIUniversityListCreateView.as_view(), name='api_university_list_create'),
    path('api/universities/public/', APIPublicUniversityListView.as_view(), name='api_university_public_list'),
    path('api/universities/<int:university_id>/', APIUniversityDetailView.as_view(), name='api_university_detail'),
    path('api/universities/<int:university_id>/extend-access/', APIUniversityExtendAccessView.as_view(), name='api_university_extend_access'),
]