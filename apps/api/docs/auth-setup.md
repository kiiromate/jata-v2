# Configure Email Authentication

1. In your Supabase dashboard, go to **Authentication > Providers** and ensure **Email** is enabled.
2. For testing purposes, you can disable **Confirm email** under the Email provider settings.
3. Run the following SQL in the **SQL Editor** to create a trigger that adds new users to the `public.users` table:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. You can add a test user in **Authentication > Users > Add User**.
