import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('StudentRecords')

def lambda_handler(event, context):
    try:
        student_id = event['pathParameters']['studentid']
        body = json.loads(event['body'])

        update_expression = "SET "
        expression_values = {}
        expression_names = {}

        for key, value in body.items():
            if key != 'studentId':
                if isinstance(value, float):
                    value = Decimal(str(value))
                update_expression += f"#{key} = :{key}, "
                expression_names[f"#{key}"] = key
                expression_values[f":{key}"] = value

        update_expression = update_expression.rstrip(', ')

        table.update_item(
            Key={'studentId': student_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_names,
            ExpressionAttributeValues=expression_values
        )
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'PUT, OPTIONS'
            },
            'body': json.dumps({'message': 'Student updated successfully', 'studentId': student_id})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }