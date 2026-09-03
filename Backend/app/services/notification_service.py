from app.models.notification import Notification


def create_notification(
    db,
    recipient_type,
    recipient_name,
    notification_type,
    title,
    message,
    recipient_id=None,
    problem_id=None,
    project_id=None,
    milestone_id=None
):
    notification = Notification(
        recipient_type=recipient_type,
        recipient_id=recipient_id,
        recipient_name=recipient_name,
        problem_id=problem_id,
        project_id=project_id,
        milestone_id=milestone_id,
        notification_type=notification_type,
        title=title,
        message=message,
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification