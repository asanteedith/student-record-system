import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('StudentRecords')

def lambda_handler(event, context):
    try:
        student_id = event['pathParameters']['studentid']
        table.delete_item(Key={'studentId': student_id})
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
            },
            'body': json.dumps({'message': 'Student deleted successfully', 'studentId': student_id})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }