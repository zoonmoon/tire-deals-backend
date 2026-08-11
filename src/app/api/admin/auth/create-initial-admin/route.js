    import bcrypt from 'bcryptjs';


export async function GET(){


    const passwordHash = await bcrypt.hash(
        'YOUR_PASSWORD_HERE',
        12
    );

    console.log(passwordHash);

}