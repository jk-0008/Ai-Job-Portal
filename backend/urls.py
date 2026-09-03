# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),  # Includes auth routes
    path('api/jobs/', include('jobs.urls')),
    path('api/applications/', include('applications.urls')),
    path('api/companies/', include('companies.urls')),
]

# Serve media files (Resumes) during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
