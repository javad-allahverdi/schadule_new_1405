from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scheduling_module', '0003_alter_studentgroup_options_studentgroup_degree_level_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='universityconfig',
            name='benchmark_key',
            field=models.CharField(
                blank=True,
                default='',
                help_text='برای نیمسال‌هایی که از داده‌های آزمون (benchmark seed) ساخته شده‌اند',
                max_length=100,
                verbose_name='کلید مجموعه‌ی آزمون',
            ),
        ),
    ]
