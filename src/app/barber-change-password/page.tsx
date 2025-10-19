'use client'; 'use client'; 'use client';



import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react'; import { useState, useEffect } from 'react';

export default function BarberChangePassword() {

    const router = useRouter(); import { useRouter } from 'next/navigation'; import { useRouter } from 'next/navigation';

    const [currentPassword, setCurrentPassword] = useState('');

    const [newPassword, setNewPassword] = useState('');

    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false); interface BarberSession {export default function BarberChangePassword() {

        const [error, setError] = useState('');

        const [success, setSuccess] = useState(''); user: {
            const router = useRouter();

            const [barberSession, setBarberSession] = useState<any>(null);

            _id: string; const [currentPassword, setCurrentPassword] = useState('');

            useEffect(() => {

                const session = localStorage.getItem('barberSession'); username: string; const [newPassword, setNewPassword] = useState('');

                if (!session) {

                    router.push('/barber-login'); name: string; const [confirmPassword, setConfirmPassword] = useState('');

                    return;

                } role: string; const [loading, setLoading] = useState(false);



                try { }    const [error, setError] = useState('');

                const parsedSession = JSON.parse(session);

                setBarberSession(parsedSession);
            }    const [barberSession, setBarberSession] = useState<any>(null);

        } catch (error) {

            console.error('Error parsing barber session:', error);

            router.push('/barber-login');

        } export default function BarberChangePassword() {
            useEffect(() => {

            }, [router]);

            const router = useRouter(); const [barberSession, setBarberSession] = useState<any>(null); const [barberSession, setBarberSession] = useState<any>(null);

            const handleSubmit = async (e: React.FormEvent) => {

                e.preventDefault(); const [currentPassword, setCurrentPassword] = useState('');

                setError('');

                setSuccess(''); const [newPassword, setNewPassword] = useState('');                // Check if barber is logged in



                if (newPassword !== confirmPassword) {
                    const [confirmPassword, setConfirmPassword] = useState('');

                    setError('رمز عبور جدید و تأیید آن یکسان نیستند');

                    return; const [loading, setLoading] = useState(false); const session = localStorage.getItem('barberSession'); const [loading, setLoading] = useState(true); const [loading, setLoading] = useState(true);

                }

                const [error, setError] = useState('');

                if (newPassword.length < 6) {

                    setError('رمز عبور جدید باید حداقل 6 کاراکتر باشد'); const [success, setSuccess] = useState(''); if (!session) {

                        return;

                    } const [barberSession, setBarberSession] = useState<BarberSession | null>(null);



                    setLoading(true); router.push('/barber-login'); const [saving, setSaving] = useState(false); const [saving, setSaving] = useState(false);



                    try {    // Additional form fields for profile update

                        const barberId = barberSession?.user.username || barberSession?.user.name;

                        const [formData, setFormData] = useState({
                            return;

                            const response = await fetch(`/api/barber/profile/${encodeURIComponent(barberId)}`, {

                                method: 'PUT', newUsername: '',

                                headers: {

                                    'Content-Type': 'application/json', newName: '',
                                } const [error, setError] = useState(''); const [error, setError] = useState('');

                            },

                                body: JSON.stringify({
                                    phone: ''

                    currentPassword,

                                    newPassword
                                });

                        })

                    });



                    const data = await response.json(); useEffect(() => {
                        const parsedSession = JSON.parse(session); const [success, setSuccess] = useState(''); const [success, setSuccess] = useState('');



                        if (response.ok) {        // Check authentication

                            setSuccess('رمز عبور با موفقیت تغییر کرد');

                            setCurrentPassword(''); const session = localStorage.getItem('barberSession'); if (parsedSession.user.type !== 'barber') {

                                setNewPassword('');

                                setConfirmPassword(''); if (!session) {

                                } else {

                                    setError(data.message || 'خطا در تغییر رمز عبور'); router.push('/barber-login'); router.push('/barber-login'); const [profile, setProfile] = useState<any>(null); const [profile, setProfile] = useState<any>(null);

                                }

                            } catch (error) {
                                return;

                                console.error('Error changing password:', error);

                                setError('خطا در اتصال به سرور');
                            } return;

                        } finally {

                            setLoading(false);

                        }

                    }; try { }



    if (!barberSession) {
                        const parsedSession = JSON.parse(session);

                        return (

                            <div className="min-h-screen flex items-center justify-center">            setBarberSession(parsedSession);

                                <div className="text-center">در حال بارگذاری...</div>

                            </div>

                        );

                    }            // Pre-fill form data                setBarberSession(parsedSession); const [formData, setFormData] = useState({



                    return (setFormData({
                        const [formData, setFormData] = useState({

        < div className = "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8" dir = "rtl" >

                        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">                newUsername: parsedSession.user.username || '',

                            <div className="text-center mb-8">

                                <h1 className="text-3xl font-bold text-gray-900 mb-2">                newName: parsedSession.user.name || '',                    }, [router]);

                                    تغییر رمز عبور

                                </h1>                phone: parsedSession.user.phone || ''

                                <p className="text-gray-600">

                                    خوش آمدید {barberSession.user.name}            });                    currentPassword: '', currentPassword: '',

                                </p>

                            </div>        } catch (error) {



                                <form onSubmit={handleSubmit} className="space-y-6">            console.error('Error parsing barber session:', error);                    const handleSubmit = async (e: React.FormEvent) => {

                                    { error && (

                                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">            router.push('/barber-login');

                                            {error}

                                        </div>        }                        e.preventDefault(); newPassword: '', newPassword: '',

                    )}

    }, [router]);

                                    {success && (

                                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">                            setError('');

                                            {success}

                                        </div>    const handleSubmit = async (e: React.FormEvent) => {

                    )}

                                    e.preventDefault();                        confirmPassword: '', confirmPassword: '',

                                    <div>

                                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">        setError('');

                                            رمز عبور فعلی

                                        </label>        setSuccess('');        if (newPassword !== confirmPassword) {

                                            <input

                                                type="password"

                                                id="currentPassword"

                                                value={currentPassword} if (newPassword !== confirmPassword) {setError('رمز عبور جدید و تأیید آن یکسان نیستند'); newUsername: '', newUsername: '',

                                        onChange={(e) => setCurrentPassword(e.target.value)}

                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"            setError('رمز عبور جدید و تأیید آن یکسان نیستند');

                                        required

                        />            return;            return;

                                    </div>

        }

                                    <div>

                                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">                        } newName: '', newName: '',

                                            رمز عبور جدید

                                        </label>        if (newPassword.length < 6) {

                                            <input

                                                type="password" setError('رمز عبور جدید باید حداقل 6 کاراکتر باشد');

                                        id="newPassword"

                                        value={newPassword}            return;

                                        onChange={(e) => setNewPassword(e.target.value)}

                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"        }        if (newPassword.length < 6) {

                                            required

                            minLength={6}                            phone: ''        phone: ''

                        />

                                    </div>        setLoading(true);



                                    <div>                            setError('رمز عبور جدید باید حداقل 6 کاراکتر باشد');

                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">

                                            تأیید رمز عبور جدید        try {

                        </label>

                                        <input const barberId= barberSession?.user.username || barberSession?.user.name;                            return;

                                        type="password"

                            id="confirmPassword"                        });

                                        value={confirmPassword}

                                        onChange={(e) => setConfirmPassword(e.target.value)}            const response = await fetch(`/api/barber/profile/${encodeURIComponent(barberId!)}`, { });

                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                                        required                method: 'PUT',

                                        minLength={6}

                        />                headers: { }

                                    </div>

                                    'Content-Type': 'application/json',

                                    <div className="flex gap-4">

                                        <button                },

                                        type="submit"

                                        disabled={loading}                body: JSON.stringify({

                                            className = "flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"

                                            > currentPassword, setLoading(true);

                                        {loading ? 'در حال تغییر...' : 'تغییر رمز عبور'}

                                    </button>                    newPassword,



                                    <button username:formData.newUsername,        useEffect(() => {

                                        type = "button"

                            onClick={() => router.back()}                    name: formData.newName,            useEffect(() => {

                                        className = "flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"

                                        > phone: formData.phone

                                    بازگشت

                                </button>})                try {

                    </div>

                </form >            });

            </div >

        </div >                    const barberId = barberSession.user.username || barberSession.user.name;        // Check authentication        // Check authentication

    );

    } const data = await response.json();



    if (response.ok) {

        setSuccess('اطلاعات با موفقیت بروزرسانی شد'); const response = await fetch(`/api/barber/profile/${encodeURIComponent(barberId)}`, {

            const session = localStorage.getItem('barberSession'); const session = localStorage.getItem('barberSession');

            // Update local session if username changed

            if(formData.newUsername !== barberSession?.user.username) { method: 'PUT',

                const updatedSession = {

                    ...barberSession, headers: {

                        user: {
                            if(!session) {

                            ...barberSession!.user, if(!session) {

                                username: formData.newUsername,

                                    name: formData.newName                                    'Content-Type': 'application/json',

                        }

                        };
                    }, router.push('/barber-login'); router.push('/barber-login');

                    localStorage.setItem('barberSession', JSON.stringify(updatedSession));

                    setBarberSession(updatedSession);                                body: JSON.stringify({

                    }

                                    currentPassword, return; return;

                    // Clear form

                    setCurrentPassword('');                                    newPassword

                setNewPassword('');

                setConfirmPassword('');
                })

            } else { }

        setError(data.message || 'خطا در بروزرسانی اطلاعات');
    }

}

        } catch (error) { });

console.error('Error updating profile:', error);

setError('خطا در اتصال به سرور');

        } finally {

    setLoading(false); const result = await response.json();

}

    }; const parsedSession = JSON.parse(session); const parsedSession = JSON.parse(session);



const handleInputChange = (field: string, value: string) => {
    if (response.ok) {

        setFormData(prev => ({

            ...prev, alert('رمز عبور با موفقیت تغییر یافت'); if(parsedSession.user.type !== 'barber') {

            [field]: value                            if(parsedSession.user.type !== 'barber') {

        }));

    }; router.push(`/barber-dashboard/${barberId}`);



    if (!barberSession) { } else {

        return (router.push('/barber-login'); router.push('/barber-login');

        <div className="min-h-screen flex items-center justify-center">

            <div className="text-center">در حال بارگذاری...</div>                                setError(result.error || 'خطا در تغییر رمز عبور');

        </div>

        );                            } return; return;

    }

                        } catch (error) {

    return (

        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">                            console.error('Error changing password:', error);

            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">                        }

                <div className="text-center mb-8">                    }

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">

                        مدیریت پروفایل                    setError('خطا در اتصال به سرور');

                    </h1>

                    <p className="text-gray-600">                } finally {

                        خوش آمدید {barberSession.user.name}

                    </p>                    setLoading(false);

                </div>

                } setBarberSession(parsedSession); setBarberSession(parsedSession);

                <form onSubmit={handleSubmit} className="space-y-6">

                    {error && (            };

                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">

                        {error}            loadProfile(parsedSession.user.username || parsedSession.user.name); loadProfile(parsedSession.user.username || parsedSession.user.name);

                    </div>

                    )}            const handleBack = () => {



                        { success && (                const barberId = barberSession?.user?.username || barberSession?.user?.name;

                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">            }, [router]);

                        {success}    }, [router]);

                    </div>

                    )}    router.push(`/barber-dashboard/${barberId}`);



                    <div>};

                        <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-2">

                            نام کاربری جدید

                        </label>

                        <inputif (!barberSession) {

                            type = "text"    const loadProfile = async (barberId: string) => {

                            id = "newUsername"        const loadProfile = async (barberId: string) => {

                            value = { formData.newUsername }

                            onChange={(e) => handleInputChange('newUsername', e.target.value)}            return (

                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                        required                <div className="min-h-screen flex items-center justify-center relative overflow-hidden" try {        try {

                        />

                    </div>                style = {{



                    < div > backgroundImage: 'url(/picbg2.jpg)', setLoading(true); setLoading(true);

                    <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-2">

                        نام نمایشی جدید            backgroundSize: 'cover',

                    </label>

                    <input backgroundPosition: 'center', console.log('📋 Loading profile for:', barberId); console.log('📋 Loading profile for:', barberId);

                    type="text"

                    id="newName"            backgroundRepeat: 'no-repeat',

                    value={formData.newName}

                    onChange={(e) => handleInputChange('newName', e.target.value)}                backgroundAttachment: 'fixed'

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                            required        }

                        />    }>

            </div>

            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>            const response = await fetch(`/api/barber/profile/${encodeURIComponent(barberId)}`); const response = await fetch(`/api/barber/profile/${encodeURIComponent(barberId)}`);

            <div>

                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">    <div className="glass-card p-8 relative z-10">

                    شماره تلفن

                </label>        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60 mx-auto"></div>            const data = await response.json();            const data = await response.json();

                <input

                    type="tel"    </div>

            id="phone"

            value={formData.phone}            </div >                        

                            onChange = {(e) => handleInputChange('phone', e.target.value)
}

className = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"        );

placeholder = "09xxxxxxxxx"

    />} if (response.ok && data.success) {

                    </div >    if (response.ok && data.success) {



            <div>

                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">

                    رمز عبور فعلی        return (setProfile(data.profile); setProfile(data.profile);

                </label>

                <input        <div className="min-h-screen p-4 relative overflow-hidden"

                    type="password"

                    id="currentPassword" dir="rtl" setFormData(prev => ({setFormData(prev => ({

                        value={ currentPassword }

                            onChange={(e) => setCurrentPassword(e.target.value)}                style={{

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                            required                backgroundImage: 'url(/picbg2.jpg)', ...prev, ...prev,

                        />

                    </div>                backgroundSize: 'cover',



                    <div>                backgroundPosition: 'center', newUsername: data.profile.username || '', newUsername: data.profile.username || '',

                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">

                            رمز عبور جدید                backgroundRepeat: 'no-repeat',

                        </label>

                        <input                backgroundAttachment: 'fixed'                    newName: data.profile.name || '', newName: data.profile.name || '',

                            type="password"

                            id="newPassword"            }}>

                            value={newPassword}

                            onChange={(e) => setNewPassword(e.target.value)}                {/* Background overlay */ }                    phone: data.profile.phone || ''                    phone: data.profile.phone || ''

                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                            required                    < div className = "absolute inset-0 bg-black/40 backdrop-blur-sm" ></div >

                            minLength={6}

                        />                }));                }));

                    </div>

<div className="max-w-2xl mx-auto relative z-10">

                    <div>

                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">    {/* Header */}                console.log('✅ Profile loaded successfully');                console.log('✅ Profile loaded successfully');

                            تأیید رمز عبور جدید

                        </label>    <div className="glass-card p-6 mb-6 floating">

                        <input

                            type="password"        <div className="flex items-center justify-between">            } else { } else {

                            id="confirmPassword"

                            value={confirmPassword}            <div>

                            onChange={(e) => setConfirmPassword(e.target.value)}

                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"                <h1 className="text-2xl font-bold text-glass flex items-center">                setError(data.error || 'خطا در بارگذاری پروفایل');                setError(data.error || 'خطا در بارگذاری پروفایل');

                            required

                            minLength={6}                    🔒 تغییر رمز عبور

                        />

                    </div>                </h1>            }            }



                    <div className="flex gap-4">                <p className="text-glass-secondary mt-2">

                        <button

                            type="submit"                    آرایشگر: {barberSession.user.name}        } catch (err) { } catch (err) {

                            disabled={loading}

                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"                            </p>

                        >

                            {loading ? 'در حال بروزرسانی...' : 'بروزرسانی اطلاعات'}            </div>            console.error('❌ Error loading profile:', err);            console.error('❌ Error loading profile:', err);

                        </button>

            <button

                        <button

                            type="button"                onClick={handleBack} setError('خطا در اتصال به سرور');            setError('خطا در اتصال به سرور');

                            onClick={() => router.back()}

                            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"            className="glass-button px-4 py-2"

                        >

                            بازگشت                        >        } finally { } finally {

                        </button>

                    </div>                            🔙 بازگشت

                </form >

            </div >        </button > setLoading(false); setLoading(false);

        </div >

    );    </div >

}
</div >        }        }



{/* Change Password Form */ }    };    };

<div className="glass-card p-6">

    {error && (

        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">

            <p className="text-red-400 text-center">{error}</p>    const handleSubmit = async (e: React.FormEvent) => {    const handleSubmit = async (e: React.FormEvent) => {

                        </div>

    )}        e.preventDefault();        e.preventDefault();



    <form onSubmit={handleSubmit} className="space-y-6">        setSaving(true);        setSaving(true);

        <div>

            <label className="block text-sm font-medium text-white mb-2">        setError('');        setError('');

                رمز عبور فعلی

            </label>        setSuccess('');        setSuccess('');

            <input

                type="password"

                value={currentPassword}

                onChange={(e) => setCurrentPassword(e.target.value)} try {        try {

                                className = "w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"

                                placeholder="رمز عبور فعلی را وارد کنید"            // Validation            // Validation

                required

            />            if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {            if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {

                        </div>

        setError('رمز عبور جدید و تکرار آن مطابقت ندارند');                setError('رمز عبور جدید و تکرار آن مطابقت ندارند');

        <div>

            <label className="block text-sm font-medium text-white mb-2">                return;                return;

                رمز عبور جدید

            </label>            }            }

            <input

                type="password"

                value={newPassword}

                onChange={(e) => setNewPassword(e.target.value)} if (formData.newPassword && formData.newPassword.length < 6) {            if (formData.newPassword && formData.newPassword.length < 6) {

                className = "w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"

                                placeholder="رمز عبور جدید (حداقل 6 کاراکتر)"                setError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد');                setError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد');

            required

            minLength={6}                return;                return;

                            />

        </div>            }            }



        <div>

            <label className="block text-sm font-medium text-white mb-2">

                تأیید رمز عبور جدید            if (!formData.currentPassword && (formData.newPassword || formData.newUsername !== profile?.username)) {            if (!formData.currentPassword && (formData.newPassword || formData.newUsername !== profile.username)) {

                            </label>

            <input setError('برای تغییر رمز عبور یا نام کاربری، رمز عبور فعلی الزامی است');                setError('برای تغییر رمز عبور یا نام کاربری، رمز عبور فعلی الزامی است');

            type="password"

            value={confirmPassword}                return;                return;

            onChange={(e) => setConfirmPassword(e.target.value)}

                                className="w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"            }            }

            placeholder="تکرار رمز عبور جدید"

            required

                            />

        </div>            const barberId = barberSession.user.username || barberSession.user.name;            const barberId = barberSession.user.username || barberSession.user.name;



        <div className="flex gap-4">

            <button

                type="submit" const updateData:any={ };            const updateData: any = { };

            disabled={loading}

            className="flex-1 glass-button glass-success py-3 font-medium disabled:opacity-50"                        

                            >

            {loading ? (            if (formData.currentPassword) {            if (formData.currentPassword) {

                <div className="flex items-center justify-center">

                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/60 ml-2"></div>                updateData.currentPassword = formData.currentPassword;                updateData.currentPassword = formData.currentPassword;

                    در حال تغییر...

                </div>}            }

            ) : (

            '🔒 تغییر رمز عبور'                        

                                )}

        </button>            if (formData.newPassword) {            if (formData.newPassword) {



            <button updateData.newPassword = formData.newPassword;                updateData.newPassword = formData.newPassword;

        type="button"

        onClick={handleBack}            }            }

        className="px-6 glass-button"

                            >

        انصراف

    </button>            if (formData.newUsername !== profile?.username) {            if (formData.newUsername !== profile.username) {

                        </div>

                    </form > updateData.newUsername = formData.newUsername; updateData.newUsername = formData.newUsername;

                </div >

            </div >            }            }

        </div >

    );                        

}
if (formData.newName !== profile?.name) {
    if (formData.newName !== profile.name) {

        updateData.newName = formData.newName; updateData.newName = formData.newName;

    }
}



if (formData.phone !== profile?.phone) {
    if (formData.phone !== profile.phone) {

        updateData.phone = formData.phone; updateData.phone = formData.phone;

    }
}



console.log('🔧 Updating profile with:', Object.keys(updateData)); console.log('🔧 Updating profile with:', Object.keys(updateData));



const response = await fetch(`/api/barber/profile/${encodeURIComponent(barberId)}`, {
    const response = await fetch(`/api/barber/profile/${encodeURIComponent(barberId)}`, {

        method: 'PUT', method: 'PUT',

        headers: {
            headers: {

                'Content-Type': 'application/json', 'Content-Type': 'application/json',

            },
        },

        body: JSON.stringify(updateData)                body: JSON.stringify(updateData)

    });
});



const result = await response.json(); const result = await response.json();



if (response.ok && result.success) {
    if (response.ok && result.success) {

        setSuccess('پروفایل با موفقیت بروزرسانی شد!'); setSuccess('پروفایل با موفقیت بروزرسانی شد!');



        // Update session if username changed                // Update session if username changed

        if (formData.newUsername !== profile?.username) {
            if (formData.newUsername !== profile.username) {

                const updatedSession = {
                    const updatedSession = {

                        ...barberSession, ...barberSession,

                        user: {
                            user: {

                                ...barberSession.user, ...barberSession.user,

                                username: formData.newUsername, username: formData.newUsername,

                                name: formData.newName                            name: formData.newName

                            }
                        }

                    };
                };

                localStorage.setItem('barberSession', JSON.stringify(updatedSession)); localStorage.setItem('barberSession', JSON.stringify(updatedSession));

                setBarberSession(updatedSession); setBarberSession(updatedSession);

            }
        }



        // Reload profile                // Reload profile

        await loadProfile(formData.newUsername || formData.newName); await loadProfile(formData.newUsername || formData.newName);



        // Clear password fields                // Clear password fields

        setFormData(prev => ({ setFormData(prev => ({

            ...prev, ...prev,

            currentPassword: '', currentPassword: '',

            newPassword: '', newPassword: '',

            confirmPassword: ''                    confirmPassword: ''

        }));
    }));



    // Auto redirect to dashboard after 2 seconds                // Auto redirect to dashboard after 2 seconds

    setTimeout(() => {
        setTimeout(() => {

            const newUsername = formData.newUsername || profile?.username; const newUsername = formData.newUsername || profile.username;

            router.push(`/barber-dashboard/${newUsername}`); router.push(`/barber-dashboard/${newUsername}`);

        }, 2000);
    }, 2000);



} else { } else {

    setError(result.error || 'خطا در بروزرسانی پروفایل'); setError(result.error || 'خطا در بروزرسانی پروفایل');

}            }



        } catch (err) { } catch (err) {

    console.error('❌ Error updating profile:', err); console.error('❌ Error updating profile:', err);

    setError('خطا در اتصال به سرور'); setError('خطا در اتصال به سرور');

} finally { } finally {

    setSaving(false); setSaving(false);

}        }

    };    };



const handleBack = () => {
    const handleBack = () => {

        const barberId = barberSession?.user?.username || barberSession?.user?.name; const barberId = barberSession?.user?.username || barberSession?.user?.name;

        if (barberId) {
            if (barberId) {

                router.push(`/barber-dashboard/${barberId}`); router.push(`/barber-dashboard/${barberId}`);

            } else { } else {

                router.push('/barber-login'); router.push('/barber-login');

            }
        }

    };
};



if (loading) {
    try {

        return (setLoading(true);

        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"

            style={{
                const response = await fetch('/api/barber-auth/change-password', {

                    backgroundImage: 'url(/picbg2.jpg)', method: 'POST',

                    backgroundSize: 'cover', headers: {

                        backgroundPosition: 'center', 'Content-Type': 'application/json',

                        backgroundRepeat: 'no-repeat',
                    },

                    backgroundAttachment: 'fixed'                body: JSON.stringify({

                    }} > username: barberSession.user.username,

                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>                    currentPassword: persianToEnglish(currentPassword),

                    <div className="glass-card p-8 text-center relative z-10">                    newPassword: persianToEnglish(newPassword)

                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60 mx-auto"></div>                })

                        <p className="mt-4 text-white/90">در حال بارگذاری...</p>            });

                    </div>

            </div >            const result = await response.json();

        );

            }            if (response.ok) {

            alert('رمز عبور شما با موفقیت تغییر کرد!\nلطفاً مجدداً وارد شوید.');

            return (localStorage.removeItem('barberSession');

            <div className="min-h-screen p-4 relative overflow-hidden" router.push('/barber-login');

            dir = "rtl"
        } else {

            style = {{
                setError(result.error || 'خطا در تغییر رمز عبور');

                backgroundImage: 'url(/picbg2.jpg)',            }

            backgroundSize: 'cover',        } catch (err) {

                backgroundPosition: 'center', setError('خطا در اتصال به سرور');

                backgroundRepeat: 'no-repeat',        } finally {

            backgroundAttachment: 'fixed'            setLoading(false);

        }
    }>        }

{/* Background overlay */ }    };

<div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

if (!barberSession) {

    {/* Animated Background Elements */ } return (

        <div className="fixed inset-0 overflow-hidden pointer-events-none">            <div className="min-h-screen flex items-center justify-center">

            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>

            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>            </div>

        </div>);

}

            <div className="max-w-2xl mx-auto relative z-10">

                {/* Header */}    return (

                <div className="glass-card p-6 mb-6 floating">        <div className="min-h-screen relative flex items-center justify-center overflow-hidden"

                    <div className="flex items-center justify-between">            style={{

                        <div>                backgroundImage: 'url(/picbg2.jpg)',

                            <h1 className="text-2xl font-bold text-glass flex items-center">                backgroundSize: 'cover',

                                🔒 مدیریت پروفایل                backgroundPosition: 'center',

                            </h1>                backgroundRepeat: 'no-repeat',

                            <p className="text-glass-secondary mt-2">                backgroundAttachment: 'fixed'

                                تغییر رمز عبور، نام کاربری و اطلاعات شخصی            }}>

                            </p>            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

                        </div>

                        <button            <div className="absolute inset-0 overflow-hidden">

                            onClick={handleBack}                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>

                            className="glass-button px-4 py-2"                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

                        >            </div>

                            🔙 بازگشت

                        </button>            <div className="relative max-w-md w-full mx-4 p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">

                    </div>                <div className="text-center mb-8">

                </div>                    <div className="inline-block bg-green-500/20 p-4 rounded-full mb-4">

                        <span className="text-4xl">🔒</span>

                {/* Success Message */}                    </div>

{
    success && (                    <h1 className="text-2xl font-bold text-white mb-2">تغییر رمز عبور</h1>

                    <div className="glass-card p-4 mb-6 border-2 border-green-400/40">                    <p className="text-white/70">{barberSession.user.name}</p>

                        <div className="flex items-center">                </div>

                            <span className="text-2xl ml-3">✅</span>

                            <div>                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">

                                <p className="text-green-400 font-medium">{success}</p>                    <input type="text" style={{ display: 'none' }} />

                                <p className="text-glass-secondary text-sm">در حال هدایت به داشبورد...</p>                    <input type="password" style={{ display: 'none' }} />

                            </div>

                        </div>                    {/* Current Password */ }

                    </div > <div>

                )}                        <label className="block text-sm font-medium text-white mb-2">

            رمز عبور فعلی

            {/* Error Message */}                        </label>

        {error && (<input

            <div className="glass-card p-4 mb-6 border-2 border-red-400/40">                            type="password"

            <div className="flex items-center">                            value={currentPassword}

                <span className="text-2xl ml-3">❌</span>                            onChange={(e) => setCurrentPassword(e.target.value)}

                <p className="text-red-400">{error}</p>                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all"

            </div>                            placeholder="رمز عبور فعلی"

        </div>                            autoComplete="off"

                )}                            required

                        />

        {/* Current Profile Info */}                    </div>

    {
        profile && (

            <div className="glass-card p-6 mb-6">                    {/* New Password */}

                <h2 className="text-lg font-bold text-glass mb-4">اطلاعات فعلی</h2>                    <div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">                        <label className="block text-sm font-medium text-white mb-2">

                        <div>                            رمز عبور جدید

                            <p className="text-glass-secondary text-sm">نام کاربری</p>                        </label>

                        <p className="text-glass font-medium">{profile.username}</p>                        <input

                            </div>                            type="password"

                    <div>                            value={newPassword}

                        <p className="text-glass-secondary text-sm">نام</p>                            onChange={(e) => setNewPassword(e.target.value)}

                        <p className="text-glass font-medium">{profile.name}</p>                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all"

                    </div>                            placeholder="حداقل 6 کاراکتر"

                    <div>                            autoComplete="new-password"

                        <p className="text-glass-secondary text-sm">تلفن</p>                            minLength={6}

                        <p className="text-glass font-medium">{profile.phone || 'وارد نشده'}</p>                            required

                    </div>                        />

                    <div>                    </div>

                    <p className="text-glass-secondary text-sm">وضعیت</p>

                    <p className="text-glass font-medium">                    {/* Confirm New Password */}

                        {profile.isVerified ? '✅ تأیید شده' : '⏳ در انتظار تأیید'}                    <div>

                    </p>                        <label className="block text-sm font-medium text-white mb-2">

                </div>                            تأیید رمز عبور جدید

            </div>                        </label >

                    </div > <input

                )} type = "password"

    value = { confirmPassword }

    {/* Profile Update Form */ } onChange = {(e) => setConfirmPassword(e.target.value)
}

                <div className="glass-card p-6">                            className="w-full p-4 rounded-xl bg-white/90 text-gray-800 border border-white/40 placeholder-gray-500 focus:bg-white focus:border-white/60 focus:outline-none transition-all"

                    <form onSubmit={handleSubmit} className="space-y-6">                            placeholder="تکرار رمز عبور جدید"

                        {/* Basic Info Section */}                            autoComplete="new-password"

                        <div>                            required

                            <h3 className="text-lg font-bold text-glass mb-4">اطلاعات پایه</h3>                        />

                            <div className="grid grid-cols-1 gap-4">                    </div>

                                <div>

                                    <label className="block text-sm font-medium text-white mb-2">                    {error && (

                                        نام کاربری جدید                        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">

                                    </label>                            {error}

                                    <input                        </div>

                                        type="text"                    )}

                                        value={formData.newUsername}

                                        onChange={(e) => setFormData(prev => ({ ...prev, newUsername: e.target.value }))}                    <button

                                        className="w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"                        type="submit"

                                        placeholder="نام کاربری جدید (اختیاری)"                        disabled={loading}

                                    />                        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all disabled:cursor-not-allowed"

                                </div>                    >

                                <div>                        {loading ? 'در حال تغییر...' : 'تغییر رمز عبور'}

                                    <label className="block text-sm font-medium text-white mb-2">                    </button>

                                        نام جدید                </form>

                                    </label>

                                    <input                <div className="mt-6 text-center space-y-2">

                                        type="text"                    <button

                                        value={formData.newName}                        onClick={() => router.back()}

                                        onChange={(e) => setFormData(prev => ({ ...prev, newName: e.target.value }))}                        className="text-white/70 hover:text-white text-sm transition-colors"

                                        className="w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"                    >

                                        placeholder="نام جدید (اختیاری)"                        ← بازگشت به داشبورد

                                    />                    </button>

                                </div>                </div >

                                <div>            </div>

                                    <label className="block text-sm font-medium text-white mb-2">        </div>

                                        شماره تلفن    );

                                    </label >}

<input

    type="tel"
    value={formData.phone}
    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
    className="w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
    placeholder="09123456789"
/>
                                </div >
                            </div >
                        </div >

    {/* Password Section */ }
    < div >
                            <h3 className="text-lg font-bold text-glass mb-4">تغییر رمز عبور</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        رمز عبور فعلی *
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        className="w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="رمز عبور فعلی"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        رمز عبور جدید
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="رمز عبور جدید (حداقل ۶ کاراکتر)"
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        تکرار رمز عبور جدید
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full p-3 rounded-lg backdrop-blur-xl bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        placeholder="تکرار رمز عبور جدید"
                                    />
                                </div>
                            </div>
                        </div >

    {/* Submit Button */ }
    < div className = "flex gap-4" >
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 glass-button glass-success py-3 font-medium disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/60 ml-2"></div>
                                        در حال ذخیره...
                                    </div>
                                ) : (
                                    '💾 ذخیره تغییرات'
                                )}
                            </button>
                            
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 glass-button"
                            >
                                انصراف
                            </button>
                        </div >
                    </form >
                </div >
            </div >
        </div >
    );
}