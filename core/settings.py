import os
from pathlib import Path
from dotenv import load_dotenv
from mongoengine import connect
from pymongo import MongoClient

# Load .env file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env'), override=True)
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', '').split(',') if h.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "django.contrib.humanize",
    'registration',
    'dashboard',
    'settings',
    'support',
    'ngopost',
    'maps',
    'rest_framework',
    'donate',
    'points',
    'coupon',
    'orders',
    'shared',
    'subscription',
    'reports',
    'appointments',
    'purchase',
    'services',
    'staff',
    'history',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'dashboard.context_processors.sidebar_menu',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True


DJANGO_ENV = os.getenv('DJANGO_ENV', 'development')

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

if DJANGO_ENV == 'production':
    STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
else:
    STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


MEDIA_URL = '/document/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'document')
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 5 * 1024 * 1024

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

#GAuth
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI')

LOGIN_URL = '/'

MONGO_DATABASE_NAME = os.getenv('MONGO_DATABASE_NAME')
MONGO_DATABASE_HOST = os.getenv('MONGO_DATABASE_HOST')

connect(
    db=MONGO_DATABASE_NAME,
    host=MONGO_DATABASE_HOST,
)

MONGO_CLIENT = MongoClient(MONGO_DATABASE_HOST)
MONGO_DB = MONGO_CLIENT[MONGO_DATABASE_NAME]

MONGO_COLLECTIONS = {
    "hospital": MONGO_DB["Hospitals"],
    "pharmacy": MONGO_DB["Pharmacy"],
    "doctor":   MONGO_DB["Doctors"],
    "lab":      MONGO_DB["Labs"],
    "master_medicine": MONGO_DB["master_medicine"],
}

PLACES_COORDINATES = MONGO_DB["places"]
STORE_VALIDATION = MONGO_DB["store_detail_validation"]
TABLE_VALIDATION = MONGO_DB["table_validation"]

# Company details
COMPANY_NAME = os.environ.get("COMPANY", "")
COMPANY_GSTIN = os.environ.get("GSTIN", "")
COMPANY_ADDRESS = os.environ.get("ADDRESS", "")
COMPANY_CONTACT = os.environ.get("CONTACT", "")
COMPANY_EMAIL = os.environ.get("EMAIL", "")

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL')

# Fallback to console backend in development when SMTP is not configured
if DJANGO_ENV == 'development':
    if not EMAIL_HOST or 'yourprovider' in EMAIL_HOST or not EMAIL_HOST_USER or 'your@email' in EMAIL_HOST_USER:
        EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


