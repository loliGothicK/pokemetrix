-- Supabase Local Development Seed
-- This file is automatically executed by "supabase db reset --local"
-- It creates a default developer account so that application seeds (seed.ts) can run without manual UI signup.

INSERT INTO
    auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        'ef40a43d-e9e4-4f52-aec3-36fff7f583f8',
        'authenticated',
        'authenticated',
        'loligothick@gmail.com',
        crypt('password123', gen_salt('bf')),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        '{"provider":"email","providers":["email"]}',
        '{}',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        '',
        '',
        '',
        ''
    );

INSERT INTO
    auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
VALUES
    (
        gen_random_uuid(),
        'ef40a43d-e9e4-4f52-aec3-36fff7f583f8',
        'ef40a43d-e9e4-4f52-aec3-36fff7f583f8',
        format('{"sub":"%s","email":"%s"}', 'ef40a43d-e9e4-4f52-aec3-36fff7f583f8', 'loligothick@gmail.com')::jsonb,
        'email',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
