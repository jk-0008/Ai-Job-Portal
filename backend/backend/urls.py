# backend/urls.py
from pathlib import Path
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, FileResponse
from django.views.static import serve

FRONTEND_DIST = settings.BASE_DIR.parent / 'frontend' / 'dist'

def serve_react_app(request, *args, **kwargs):
    index_file = FRONTEND_DIST / 'index.html'
    if index_file.exists():
        return FileResponse(open(index_file, 'rb'), content_type='text/html')
    return HttpResponse(
        """
        <!DOCTYPE html>
        <html>
        <head><title>Jobi Job Portal</title></head>
        <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px;">
            <h2>Jobi Job Portal & Recruiter Dashboard</h2>
            <p>Django Backend is running.</p>
            <p><a href="/admin/">Go to Django Admin</a></p>
        </body>
        </html>
        """,
        content_type='text/html'
    )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),  # Includes auth routes
    path('api/jobs/', include('jobs.urls')),
    path('api/applications/', include('applications.urls')),
    path('api/companies/', include('companies.urls')),
]

# Static assets for built React frontend
if FRONTEND_DIST.exists():
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': str(FRONTEND_DIST / 'assets')}),
        path('favicon.svg', lambda r: FileResponse(open(FRONTEND_DIST / 'favicon.svg', 'rb'), content_type='image/svg+xml') if (FRONTEND_DIST / 'favicon.svg').exists() else HttpResponse(status=404)),
        path('jobi-icon.jpg', lambda r: FileResponse(open(FRONTEND_DIST / 'jobi-icon.jpg', 'rb'), content_type='image/jpeg') if (FRONTEND_DIST / 'jobi-icon.jpg').exists() else HttpResponse(status=404)),
        path('icons.svg', lambda r: FileResponse(open(FRONTEND_DIST / 'icons.svg', 'rb'), content_type='image/svg+xml') if (FRONTEND_DIST / 'icons.svg').exists() else HttpResponse(status=404)),
    ]

# Serve media files (Resumes) during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# SPA routes fallback: /menu/dashboard/, /dashboard/, /, /recruiter, etc.
urlpatterns += [
    path('menu/dashboard/', serve_react_app, name='menu_dashboard_slash'),
    path('menu/dashboard', serve_react_app, name='menu_dashboard'),
    path('dashboard/', serve_react_app, name='dashboard_slash'),
    path('dashboard', serve_react_app, name='dashboard'),
    re_path(r'^(?!api/|admin/|media/).*$', serve_react_app, name='frontend_app'),
]
