import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schema/user.schema';
@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: true })
  action!: string;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  performedBy!: User;
  @Prop()
  targetType?: string;
  @Prop()
  targetId?: string;
  @Prop({ type: MongooseSchema.Types.Mixed })
  details?: any;
  @Prop()
  ipAddress?: string;
}
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
