// DomainEventBase - イベントの基本型
export type DomainEventBase<TType extends string, TPayload> = {
  readonly type: TType;
  readonly payload: TPayload;
  readonly occurredAt: Date;
};

// DomainEvent - すべてのドメインイベントの共用型
// Outboxパターンでのシリアライズ/デシリアライズに対応するため、payloadはunknownとする
export type DomainEvent = DomainEventBase<string, unknown>;

// WithEvents - エンティティ操作の結果とイベントをまとめる型
export type WithEvents<TEntity, TEvent extends DomainEvent = DomainEvent> = {
  readonly entity: TEntity;
  readonly events: readonly TEvent[];
};
