# account_module/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, UserProfile, University


class UniversitySerializer(serializers.ModelSerializer):
    """نمایش/ویرایش اطلاعات یک دانشگاه (مستأجر). ایجاد از UniversityCreateSerializer است."""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    is_accessible = serializers.BooleanField(read_only=True)
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = University
        fields = [
            'id', 'name', 'subdomain', 'logo', 'contact_email', 'contact_phone',
            'address', 'is_active', 'valid_from', 'valid_until', 'max_users',
            'created_by', 'created_by_name', 'members_count',
            'is_expired', 'is_accessible', 'days_remaining',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_by', 'valid_from', 'created_at', 'updated_at']

    def get_days_remaining(self, obj):
        return obj.days_remaining()

    def validate_subdomain(self, value):
        value = value.lower().strip()
        from .models import SUBDOMAIN_RE, RESERVED_SUBDOMAINS
        if not SUBDOMAIN_RE.match(value):
            raise serializers.ValidationError('زیردامنه فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد.')
        if value in RESERVED_SUBDOMAINS:
            raise serializers.ValidationError('این زیردامنه رزرو شده است.')
        queryset = University.objects.filter(subdomain=value)
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
        if queryset.exists():
            raise serializers.ValidationError('این زیردامنه قبلاً استفاده شده است.')
        return value


class UniversityCreateSerializer(UniversitySerializer):
    """ایجاد دانشگاه به همراه (اختیاری) حساب مدیر اولیه، فقط توسط سوپروایزر"""
    admin_username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    admin_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    admin_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    admin_first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    admin_last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta(UniversitySerializer.Meta):
        fields = UniversitySerializer.Meta.fields + [
            'admin_username', 'admin_email', 'admin_password',
            'admin_first_name', 'admin_last_name',
        ]

    def validate_admin_username(self, value):
        if value and CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError('این نام کاربری قبلاً استفاده شده است.')
        return value

    def validate_admin_email(self, value):
        if value and CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError('این ایمیل قبلاً استفاده شده است.')
        return value

    def validate(self, attrs):
        admin_username = attrs.get('admin_username')
        admin_password = attrs.get('admin_password')
        if admin_username and not admin_password:
            raise serializers.ValidationError({'admin_password': 'برای ایجاد حساب مدیر، رمز عبور الزامی است.'})
        if admin_password and not admin_username:
            raise serializers.ValidationError({'admin_username': 'برای ایجاد حساب مدیر، نام کاربری الزامی است.'})
        return attrs

    def create(self, validated_data):
        admin_fields = {}
        for key in ['admin_username', 'admin_email', 'admin_password', 'admin_first_name', 'admin_last_name']:
            admin_fields[key] = validated_data.pop(key, '')

        request = self.context.get('request')
        creator = None
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
            creator = request.user

        university = University.objects.create(**validated_data)

        admin_user = None
        if admin_fields.get('admin_username') and admin_fields.get('admin_password'):
            admin_user = CustomUser.objects.create_user(
                username=admin_fields['admin_username'],
                email=admin_fields.get('admin_email') or f"{admin_fields['admin_username']}@{university.subdomain}.local",
                password=admin_fields['admin_password'],
                first_name=admin_fields.get('admin_first_name', ''),
                last_name=admin_fields.get('admin_last_name', ''),
                role='admin',
                university=university,
                is_verified=True,
            )

        # ایجاد یک «پیکربندی نیمسال» پیش‌فرض، چون بدون حداقل یک UniversityConfig
        # هیچ‌کدام از بخش‌های استاد/درس/مکان/گروه قابل ثبت نیستند.
        # (لازم است این import اینجا انجام شود تا از import چرخه‌ای بین
        # account_module و scheduling_module جلوگیری شود)
        from scheduling_module.models import UniversityConfig

        UniversityConfig.objects.create(
            university=university,
            name=f"{university.name} - نیمسال اول",
            semester="نیمسال اول",
            days_of_week=[
                {"id": 0, "name": "شنبه", "enabled": True},
                {"id": 1, "name": "یکشنبه", "enabled": True},
                {"id": 2, "name": "دوشنبه", "enabled": True},
                {"id": 3, "name": "سه‌شنبه", "enabled": True},
                {"id": 4, "name": "چهارشنبه", "enabled": True},
            ],
            time_slots=[
                {"id": 1, "start": "08:00", "end": "10:00", "enabled": True},
                {"id": 2, "start": "10:00", "end": "12:00", "enabled": True},
                {"id": 3, "start": "13:30", "end": "15:30", "enabled": True},
                {"id": 4, "start": "15:30", "end": "17:30", "enabled": True},
            ],
            max_units_per_student=20,
            max_classes_per_day=3,
            created_by=admin_user or creator,
        )

        return university


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = (
            'bio', 'address', 'birth_date', 
            'educational_background', 'expertise',
            'emergency_contact', 'emergency_phone',
            'email_notifications', 'sms_notifications'
        )


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    university_name = serializers.CharField(source='university.name', read_only=True)
    university_subdomain = serializers.CharField(source='university.subdomain', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'university', 'university_name', 'university_subdomain',
            'national_code', 'phone_number', 'gender',
            'department', 'profile_image', 'is_verified', 'is_active',
            'email_verified', 'phone_verified', 'profile', 'date_joined',
            'last_login'
        )
        read_only_fields = ('id', 'is_verified', 'email_verified', 'phone_verified', 'date_joined')
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_role_display(self, obj):
        return obj.get_role_display()


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    university_name = serializers.CharField(source='university.name', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'university', 'university_name', 'is_active', 'is_verified', 'date_joined'
        )
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_role_display(self, obj):
        return obj.get_role_display()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label='تکرار رمز عبور'
    )

    class Meta:
        model = CustomUser
        fields = (
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'role', 'national_code',
            'phone_number', 'gender', 'department', 'university'
        )
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True},
            'university': {'required': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password2": "رمزهای عبور با هم مطابقت ندارند."
            })
        return attrs

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("این نام کاربری قبلاً ثبت شده است.")
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً ثبت شده است.")
        return value

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password2": "رمزهای عبور جدید با هم مطابقت ندارند."
            })
        return attrs


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            'first_name', 'last_name', 'email', 'phone_number',
            'department', 'gender', 'is_active', 'role'
        )