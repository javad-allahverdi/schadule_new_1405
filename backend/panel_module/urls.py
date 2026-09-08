from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'panel'

router = DefaultRouter()
router.register(r'api/departments', views.DepartmentViewSet, basename='department-api')
router.register(r'api/logs', views.SystemLogViewSet, basename='systemlog-api')
router.register(r'api/dashboard-stats', views.DashboardStatsView, basename='dashboard-stats-api')

urlpatterns = [
    path('', include(router.urls)),

    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('users/', views.UserManagementView.as_view(), name='user_management'),
    path('reports/', views.ReportsView.as_view(), name='reports'),
]