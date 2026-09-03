from rest_framework.permissions import BasePermission


class IsRecruiter(BasePermission):
    message = 'Only recruiters can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'recruiter'
        )


class IsJobOwner(BasePermission):
    message = 'You can only change your own job postings.'

    def has_object_permission(self, request, view, obj):
        return obj.recruiter_id == request.user.id
