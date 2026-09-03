from django.urls import path

from .views import CompanyListCreateView

urlpatterns = [
    path('', CompanyListCreateView.as_view(), name='company_list_create'),
]
