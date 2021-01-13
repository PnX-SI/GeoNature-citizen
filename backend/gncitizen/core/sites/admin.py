from flask_admin.contrib.sqla.view import ModelView


class SiteTypeView(ModelView):
    form_excluded_columns = ['timestamp_create','timestamp_update']
