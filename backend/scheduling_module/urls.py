# from django.urls import path
# from . import views

# app_name = 'scheduling'

# urlpatterns = [
#     # آپلود و مدیریت زمان‌بندی
#     path('upload/excel/', views.ExcelUploadView.as_view(), name='excel_upload'),
#     path('upload/manual/', views.ManualInputView.as_view(), name='manual_input'),
#     path('tasks/', views.TaskListView.as_view(), name='task_list'),
#     path('tasks/create/', views.TaskCreateView.as_view(), name='task_create'),
#     path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
#     path('tasks/<int:pk>/status/', views.TaskStatusView.as_view(), name='task_status'),
#     path('tasks/<int:pk>/delete/', views.TaskDeleteView.as_view(), name='task_delete'),
#     path('tasks/<int:pk>/download/', views.DownloadScheduleView.as_view(), name='download_schedule'),
#     path('tasks/<int:pk>/result/', views.ScheduleResultView.as_view(), name='schedule_result'),

#     # API برای وضعیت
#     path('api/tasks/<int:pk>/status/', views.TaskStatusAPIView.as_view(), name='api_task_status'),

#     # مشاهده زمان‌بندی برای اساتید
#     path('teacher/schedule/', views.TeacherScheduleView.as_view(), name='teacher_schedule'),
#     path('teacher/schedule/<int:task_id>/', views.TeacherScheduleDetailView.as_view(), name='teacher_schedule_detail'),

#     # گزارشات و تحلیل
#     path('analysis/<int:task_id>/', views.ScheduleAnalysisView.as_view(), name='schedule_analysis'),
#     path('reports/conflicts/', views.ConflictReportView.as_view(), name='conflict_report'),
# ]








# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from . import views

# app_name = 'scheduling'

# # ایجاد Router برای APIها
# router = DefaultRouter()
# router.register(r'api/teachers', views.TeacherViewSet, basename='teacher-api')
# router.register(r'api/courses', views.CourseViewSet, basename='course-api')
# router.register(r'api/places', views.PlaceViewSet, basename='place-api')
# router.register(r'api/student-groups', views.StudentGroupViewSet, basename='student-group-api')
# router.register(r'api/universities', views.UniversityConfigViewSet, basename='university-api')
# router.register(r'api/constraints', views.ScheduleConstraintViewSet, basename='constraint-api')

# # URLهای اصلی
# urlpatterns = [
#     # ==================== API ENDPOINTS ====================
#     path('', include(router.urls)),  # شامل همه APIهای بالا
    
#     # ==================== WEB PAGES ====================
#     # آپلود و مدیریت زمان‌بندی
#     path('upload/excel/', views.ExcelUploadView.as_view(), name='excel_upload'),
#     path('upload/manual/', views.ManualInputView.as_view(), name='manual_input'),
#     path('tasks/', views.TaskListView.as_view(), name='task_list'),
#     path('tasks/create/', views.TaskCreateView.as_view(), name='task_create'),
#     path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
#     path('tasks/<int:pk>/status/', views.TaskStatusView.as_view(), name='task_status'),
#     path('tasks/<int:pk>/delete/', views.TaskDeleteView.as_view(), name='task_delete'),
#     path('tasks/<int:pk>/download/', views.DownloadScheduleView.as_view(), name='download_schedule'),
#     path('tasks/<int:pk>/result/', views.ScheduleResultView.as_view(), name='schedule_result'),
    
#     # API برای وضعیت (ساده)
#     path('api/tasks/<int:pk>/status/', views.TaskStatusAPIView.as_view(), name='api_task_status'),
    
#     # مشاهده زمان‌بندی برای اساتید
#     path('teacher/schedule/', views.TeacherScheduleView.as_view(), name='teacher_schedule'),
#     path('teacher/schedule/<int:task_id>/', views.TeacherScheduleDetailView.as_view(), name='teacher_schedule_detail'),
    
#     # گزارشات و تحلیل
#     path('analysis/<int:task_id>/', views.ScheduleAnalysisView.as_view(), name='schedule_analysis'),
#     path('reports/conflicts/', views.ConflictReportView.as_view(), name='conflict_report'),
    
#     # ==================== API اضافی برای فرم‌ها ====================
#     # API برای ایجاد استاد (مختص فرم React)
#     path('api/professors/create/', views.TeacherViewSet.as_view({'post': 'create'}), name='api_professor_create'),
    
#     # API برای لیست اساتید
#     path('api/professors/list/', views.TeacherViewSet.as_view({'get': 'list'}), name='api_professor_list'),
    
#     # API برای شمارش
#     path('api/professors/count/', views.TeacherViewSet.as_view({'get': 'count'}), name='api_professor_count'),
# ]

# ==================== توضیحات Endpoints ====================
"""
ENDPOINTS AVAILABLE:

1. API ENDPOINTS (REST):
   - GET    /scheduling/api/teachers/           # لیست اساتید
   - POST   /scheduling/api/teachers/           # ایجاد استاد جدید
   - GET    /scheduling/api/teachers/{id}/      # دریافت استاد خاص
   - PUT    /scheduling/api/teachers/{id}/      # به‌روزرسانی استاد
   - DELETE /scheduling/api/teachers/{id}/      # حذف استاد
   
   - GET    /scheduling/api/teachers/count/     # شمارش اساتید
   - POST   /scheduling/api/teachers/{id}/set_unavailable_times/  # تنظیم زمان‌ها
   
   - GET    /scheduling/api/courses/            # لیست دروس
   - POST   /scheduling/api/courses/            # ایجاد درس جدید
   - GET    /scheduling/api/places/             # لیست مکان‌ها
   - POST   /scheduling/api/places/             # ایجاد مکان جدید
   - GET    /scheduling/api/universities/       # لیست دانشگاه‌ها
   - POST   /scheduling/api/universities/       # ایجاد دانشگاه جدید

2. WEB PAGES:
   - /scheduling/upload/excel/                  # آپلود فایل اکسل
   - /scheduling/upload/manual/                 # ورود دستی
   - /scheduling/tasks/                         # لیست وظایف
   - /scheduling/tasks/create/                  # ایجاد وظیفه جدید
   - /scheduling/tasks/{id}/                    # جزئیات وظیفه
   - /scheduling/tasks/{id}/status/             # وضعیت وظیفه
   - /scheduling/tasks/{id}/delete/             # حذف وظیفه
   - /scheduling/tasks/{id}/download/           # دانلود زمان‌بندی
   - /scheduling/tasks/{id}/result/             # نتایج زمان‌بندی

3. API SIMPLE:
   - GET /scheduling/api/tasks/{id}/status/     # وضعیت وظیفه (JSON)

4. SPECIAL FOR REACT FORM:
   - POST /scheduling/api/professors/create/    # ایجاد استاد (فرم React)
   - GET  /scheduling/api/professors/list/      # لیست اساتید (فرم React)
   - GET  /scheduling/api/professors/count/     # شمارش اساتید (فرم React)
"""

















from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'scheduling'

# ایجاد Router برای APIها
router = DefaultRouter()
router.register(r'api/universities', views.UniversityConfigViewSet, basename='university-api')
router.register(r'api/teachers', views.TeacherViewSet, basename='teacher-api')
router.register(r'api/courses', views.CourseViewSet, basename='course-api')
router.register(r'api/places', views.PlaceViewSet, basename='place-api')
router.register(r'api/student-groups', views.StudentGroupViewSet, basename='student-group-api')
router.register(r'api/constraints', views.ScheduleConstraintViewSet, basename='constraint-api')
router.register(r'api/scheduling-tasks', views.SchedulingTaskViewSet, basename='scheduling-task-api')

# URLهای اصلی
urlpatterns = [
    # ==================== API ENDPOINTS ====================
    path('', include(router.urls)),  # شامل همه APIهای بالا
    
    # APIهای مخصوص اساتید
    path('api/teacher/schedule/', views.TeacherScheduleAPIView.as_view(), name='api_teacher_schedule'),
    path('api/teacher/courses/', views.TeacherCoursesAPIView.as_view(), name='api_teacher_courses'),
    
    # داشبوردها
    path('api/dashboard/university/', views.UniversityDashboardAPIView.as_view(), name='api_university_dashboard'),
    path('api/dashboard/education-officer/', views.EducationOfficerDashboardAPIView.as_view(), name='api_education_officer_dashboard'),
    
    # APIهای ساده
    path('api/universities/list/', views.api_university_list, name='api_university_list'),
    path('api/universities/create/', views.api_create_university, name='api_create_university'),
    path('api/universities/<int:university_id>/stats/', views.api_university_stats, name='api_university_stats'),
    
    # ==================== WEB PAGES ====================
    # آپلود و مدیریت زمان‌بندی
    path('upload/excel/', views.ExcelUploadView.as_view(), name='excel_upload'),
    path('upload/manual/', views.ManualInputView.as_view(), name='manual_input'),
    path('tasks/', views.TaskListView.as_view(), name='task_list'),
    
    # مشاهده زمان‌بندی برای اساتید
    path('teacher/schedule/', views.TeacherScheduleView.as_view(), name='teacher_schedule'),
]