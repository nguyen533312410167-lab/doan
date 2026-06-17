import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
import django
django.setup()
from django.contrib.auth import get_user_model
from accounts.models import Transaction, Category

User = get_user_model()

u = User.objects.first()
print(f'User: {u.username}')
print(f'Current date from system: ', end='')
import subprocess
subprocess.run(['date'])

txns = Transaction.objects.filter(user=u).order_by('-date')
print(f'Total transactions for {u.username}: {txns.count()}')
for t in txns:
    print(f'  id={t.id} type={t.type} amount={float(t.amount)} date={t.date}')

cats = Category.objects.all()
print(f'Categories: {cats.count()}')
for c in cats:
    print(f'  id={c.id} name={c.name} name_vi={c.name_vi} type={c.type}')