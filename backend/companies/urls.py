from django.urls import path
from .views import CompanyListCreateView, MyCompanyView

urlpatterns = [
    path('', CompanyListCreateView.as_view(), name='company_list_create'),
    path('my-company/', MyCompanyView.as_view(), name='my_company'),
]

