import { Inject } from '@nestjs/common';
import { getMetricToken, findOrCreateCounter } from './prom.utils';
import * as client from 'prom-client';

export const InjectCounterMetric = (name: string) => Inject(getMetricToken(`Counter`, name));
export const InjectGaugeMetric = (name: string) => Inject(getMetricToken(`Gauge`, name));
export const InjectHistogramMetric = (name: string) => Inject(getMetricToken(`Histogram`, name));
export const InjectSummaryMetric = (name: string) => Inject(getMetricToken(`Summary`, name));

/**
 * Create and increment a counter when the method is called
 * 
 * @param param0 
 */
export const PromMethodCounter = () => {
    return (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Function>) => {
        const className = target.constructor.name;
        const counterMetric = findOrCreateCounter({
            name: `${className}_${propertyKey.toString()}_method_counter`,
            help: `${className}#${propertyKey.toString()} called counter`,
        });
        const methodFunc = descriptor.value;
        descriptor.value = function (...args) {
            counterMetric.inc(1);
            return methodFunc.apply(this, args);
        }
    };
}

/**
 * Create and increment a counter when a new instance is created
 * 
 * @param ctor 
 */
export const PromInstanceCounter = <T extends { new(...args: any[]): {} }>(ctor: T) => {
    const counterMetric = findOrCreateCounter({
        name: `${ctor.name}_instance_counter`,
        help: `${ctor.name} object instances counter`,
    });
    return class extends ctor {
        constructor(...args) {
            counterMetric.inc(1);
            super(...args);
        }
    }
};