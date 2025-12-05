import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@acme/ui/card';
import {
    CalendarIcon,
    ClipboardListIcon,
    UsersIcon,
} from '@acme/ui/icons';

const steps = [
    {
        number: '1',
        title: 'El administrador crea el torneo',
        description:
            'Se configura la competición, fechas, sedes y parámetros iniciales.',
        icon: CalendarIcon,
    },
    {
        number: '2',
        title: 'Los equipos inscriben atletas',
        description:
            'Los entrenadores cargan la nómina preliminar con sus competidores.',
        icon: UsersIcon,
    },
    {
        number: '3',
        title: 'ACP revisa y publica',
        description:
            'Se validan datos, se aprueban y publican las nóminas oficiales.',
        icon: ClipboardListIcon,
    },
];

export default function StepsSection() {
    return (
        <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Cómo funciona el sistema
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Un proceso simple y ordenado en tres pasos
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                            <div key={idx} className="relative">
                                <Card className="border-accent/20 h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-accent/10 rounded-lg">
                                                <Icon className="h-6 w-6 text-accent" />
                                            </div>
                                            <div className="text-3xl font-bold text-accent opacity-20">
                                                {step.number}
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg">
                                            {step.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {step.description}
                                        </p>
                                    </CardContent>
                                </Card>
                                {idx < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                        <div className="text-3xl text-muted-foreground">→</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
