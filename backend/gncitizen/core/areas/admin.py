from flask_admin.contrib.sqla.view import ModelView


class AreasView(ModelView):
    create_template = "edit.html"
    edit_template = "edit.html"
    # form_excluded_columns = ["timestamp_create", "timestamp_update"]
    # column_exclude_list = ["long_desc", "short_desc"]