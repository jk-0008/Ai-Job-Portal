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
        """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jobi AI Job Portal - Backend API</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #0b0f19; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 20px; max-width: 620px; width: 100%; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center; }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; padding: 6px 14px; border-radius: 99px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
        .badge-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 10px #22c55e; }
        h1 { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 12px; }
        p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
        .actions { display: flex; flex-direction: column; gap: 12px; }
        .btn { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 24px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; transition: all 0.2s; }
        .btn-primary { background: #2563eb; color: #fff; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; }
        .btn-secondary:hover { background: #334155; }
        .endpoints { margin-top: 32px; padding-top: 24px; border-top: 1px solid #1e293b; text-align: left; }
        .endpoints h3 { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.8px; margin-bottom: 12px; }
        .endpoint-item { display: flex; justify-content: space-between; padding: 10px 14px; background: #0b0f19; border-radius: 8px; font-family: monospace; font-size: 13px; margin-bottom: 8px; color: #38bdf8; border: 1px solid #1e293b; }
        .endpoint-item span { color: #94a3b8; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge"><span class="badge-dot"></span> Backend Online &amp; Operational</div>
        <h1>Jobi AI Recruitment Backend</h1>
        <p>The Django REST Framework backend API and database services are running successfully on Render.</p>
        <div class="actions">
            <a href="https://ai-job-portal-git-main-jayaganesh1920-7319.vercel.app" target="_blank" class="btn btn-primary">Open Live Job Portal (Frontend) &rarr;</a>
            <a href="/admin/" class="btn btn-secondary">Open Django Admin Panel &rarr;</a>
            <a href="/api/jobs/" class="btn btn-secondary">Explore Jobs API (/api/jobs/) &rarr;</a>
        </div>
        <div class="endpoints">
            <h3>Key API Routes</h3>
            <div class="endpoint-item"><span>Jobs API:</span> /api/jobs/</div>
            <div class="endpoint-item"><span>Auth &amp; JWT:</span> /api/auth/login/</div>
            <div class="endpoint-item"><span>AI Screening:</span> /api/applications/analyze/</div>
            <div class="endpoint-item"><span>Admin Console:</span> /admin/</div>
        </div>
    </div>
</body>
</html>""",
        content_type='text/html'
    )

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    return Response({
        'status': 'online',
        'message': 'Jobi AI Job Portal Backend API is running successfully',
        'routes': {
            'jobs': request.build_absolute_uri('/api/jobs/'),
            'auth_login': request.build_absolute_uri('/api/auth/login/'),
            'auth_register': request.build_absolute_uri('/api/auth/register/'),
            'applications': request.build_absolute_uri('/api/applications/'),
            'companies': request.build_absolute_uri('/api/companies/'),
            'admin': request.build_absolute_uri('/admin/'),
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api_root'),
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
    re_path(r'^(?!api/|admin/|media/|static/).*$', serve_react_app, name='frontend_app'),
]
